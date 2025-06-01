/**
 * Database utility for SQLite operations
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { 
  PageviewData, 
  WebVitalMetric, 
  UserAgentData, 
  CustomEventData 
} from '../types';

// Get database path from environment or use default
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'analytics.db');
const IP_HASH_SALT = process.env.IP_HASH_SALT || 'default-salt-change-me';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database connection with WAL mode for better concurrency
let db: Database.Database;

/**
 * Initialize database connection and schema
 */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Check if tables exist, if not create them
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='pageviews'"
    ).get();
    
    if (!tableExists) {
      const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf8');
      db.exec(schema);
    }
  }
  
  return db;
}

/**
 * Hash IP address for anonymization
 */
export function hashIp(ip: string): string {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(ip + IP_HASH_SALT)
    .digest('hex');
}

/**
 * Insert or get user agent record
 */
export function insertUserAgent(userAgentData: UserAgentData): number {
  const db = getDb();
  
  // Check if user agent already exists
  const existingUserAgent = db.prepare(`
    SELECT id FROM user_agents 
    WHERE browser = ? 
    AND browser_version = ? 
    AND os = ? 
    AND os_version = ? 
    AND device_type = ? 
    AND device_vendor = ? 
    AND device_model = ?
  `).get(
    userAgentData.browser,
    userAgentData.browserVersion || null,
    userAgentData.os || null,
    userAgentData.osVersion || null,
    userAgentData.deviceType || null,
    userAgentData.deviceVendor || null,
    userAgentData.deviceModel || null
  );
  
  if (existingUserAgent) {
    return existingUserAgent.id;
  }
  
  // Insert new user agent
  const result = db.prepare(`
    INSERT INTO user_agents (
      browser, 
      browser_version, 
      os, 
      os_version, 
      device_type, 
      device_vendor, 
      device_model
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    userAgentData.browser,
    userAgentData.browserVersion || null,
    userAgentData.os || null,
    userAgentData.osVersion || null,
    userAgentData.deviceType || null,
    userAgentData.deviceVendor || null,
    userAgentData.deviceModel || null
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Insert pageview record
 */
export function insertPageview(pageviewData: PageviewData, ipAddress: string, userAgentId: number): number {
  const db = getDb();
  
  const result = db.prepare(`
    INSERT INTO pageviews (
      page_url, 
      timestamp, 
      session_id, 
      referrer, 
      ip_hash, 
      user_agent_id
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    pageviewData.pageUrl,
    pageviewData.timestamp,
    pageviewData.sessionId,
    pageviewData.referrer || null,
    hashIp(ipAddress),
    userAgentId
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Insert web vital metrics
 */
export function insertWebVitals(webVitals: WebVitalMetric[], sessionId: string, pageUrl: string): void {
  const db = getDb();
  
  const stmt = db.prepare(`
    INSERT INTO web_vitals (
      session_id, 
      page_url, 
      timestamp, 
      metric_name, 
      metric_value, 
      metric_rating
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const timestamp = Date.now();
  
  // Use transaction for better performance
  const insertMany = db.transaction((items: WebVitalMetric[]) => {
    for (const item of items) {
      stmt.run(
        sessionId,
        pageUrl,
        timestamp,
        item.name,
        item.value,
        item.rating || null
      );
    }
  });
  
  insertMany(webVitals);
}

/**
 * Insert custom event
 */
export function insertCustomEvent(eventData: CustomEventData): number {
  const db = getDb();
  
  const result = db.prepare(`
    INSERT INTO custom_events (
      session_id, 
      page_url, 
      timestamp, 
      event_name, 
      event_data
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    eventData.sessionId,
    eventData.pageUrl,
    eventData.timestamp,
    eventData.eventName,
    eventData.eventData ? JSON.stringify(eventData.eventData) : null
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Get pageview statistics
 */
export function getPageviewStats(startTime: number, endTime: number): {
  total: number;
  byDay: Array<{date: string; count: number}>;
  byPage: Array<{page: string; count: number}>;
} {
  const db = getDb();
  
  // Get total pageviews
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM pageviews 
    WHERE timestamp >= ? AND timestamp <= ?
  `).get(startTime, endTime).count;
  
  // Get pageviews by day
  const byDay = db.prepare(`
    SELECT 
      date(timestamp/1000, 'unixepoch') as date, 
      COUNT(*) as count 
    FROM pageviews 
    WHERE timestamp >= ? AND timestamp <= ? 
    GROUP BY date 
    ORDER BY date
  `).all(startTime, endTime);
  
  // Get pageviews by page
  const byPage = db.prepare(`
    SELECT 
      page_url as page, 
      COUNT(*) as count 
    FROM pageviews 
    WHERE timestamp >= ? AND timestamp <= ? 
    GROUP BY page_url 
    ORDER BY count DESC 
    LIMIT 10
  `).all(startTime, endTime);
  
  return {
    total,
    byDay,
    byPage
  };
}

/**
 * Get referrer statistics
 */
export function getReferrerStats(startTime: number, endTime: number): {
  byReferrer: Array<{referrer: string; count: number}>;
} {
  const db = getDb();
  
  // Get referrers
  const byReferrer = db.prepare(`
    SELECT 
      COALESCE(referrer, 'Direct') as referrer, 
      COUNT(*) as count 
    FROM pageviews 
    WHERE timestamp >= ? AND timestamp <= ? 
    GROUP BY referrer 
    ORDER BY count DESC 
    LIMIT 10
  `).all(startTime, endTime);
  
  return {
    byReferrer
  };
}

/**
 * Get device statistics
 */
export function getDeviceStats(startTime: number, endTime: number): {
  byBrowser: Array<{browser: string; count: number}>;
  byOS: Array<{os: string; count: number}>;
  byDeviceType: Array<{deviceType: string; count: number}>;
} {
  const db = getDb();
  
  // Get browsers
  const byBrowser = db.prepare(`
    SELECT 
      ua.browser as browser, 
      COUNT(*) as count 
    FROM pageviews p
    JOIN user_agents ua ON p.user_agent_id = ua.id
    WHERE p.timestamp >= ? AND p.timestamp <= ? 
    GROUP BY ua.browser 
    ORDER BY count DESC 
    LIMIT 10
  `).all(startTime, endTime);
  
  // Get operating systems
  const byOS = db.prepare(`
    SELECT 
      COALESCE(ua.os, 'Unknown') as os, 
      COUNT(*) as count 
    FROM pageviews p
    JOIN user_agents ua ON p.user_agent_id = ua.id
    WHERE p.timestamp >= ? AND p.timestamp <= ? 
    GROUP BY ua.os 
    ORDER BY count DESC 
    LIMIT 10
  `).all(startTime, endTime);
  
  // Get device types
  const byDeviceType = db.prepare(`
    SELECT 
      COALESCE(ua.device_type, 'Unknown') as deviceType, 
      COUNT(*) as count 
    FROM pageviews p
    JOIN user_agents ua ON p.user_agent_id = ua.id
    WHERE p.timestamp >= ? AND p.timestamp <= ? 
    GROUP BY ua.device_type 
    ORDER BY count DESC 
    LIMIT 10
  `).all(startTime, endTime);
  
  return {
    byBrowser,
    byOS,
    byDeviceType
  };
}

/**
 * Get web vitals statistics
 */
export function getWebVitalStats(startTime: number, endTime: number): {
  byMetric: Array<{
    name: string;
    average: number;
    median: number;
    p75: number;
    p95: number;
    rating: string;
  }>;
} {
  const db = getDb();
  
  // Get metrics
  const metrics = db.prepare(`
    SELECT DISTINCT metric_name FROM web_vitals
    WHERE timestamp >= ? AND timestamp <= ?
  `).all(startTime, endTime);
  
  const byMetric = [];
  
  for (const metric of metrics) {
    const name = metric.metric_name;
    
    // Get average
    const avgResult = db.prepare(`
      SELECT AVG(metric_value) as average FROM web_vitals
      WHERE metric_name = ? AND timestamp >= ? AND timestamp <= ?
    `).get(name, startTime, endTime);
    
    // Get all values for percentile calculations
    const values = db.prepare(`
      SELECT metric_value FROM web_vitals
      WHERE metric_name = ? AND timestamp >= ? AND timestamp <= ?
      ORDER BY metric_value
    `).all(name, startTime, endTime);
    
    // Calculate percentiles
    const sortedValues = values.map(v => v.metric_value);
    const median = calculatePercentile(sortedValues, 50);
    const p75 = calculatePercentile(sortedValues, 75);
    const p95 = calculatePercentile(sortedValues, 95);
    
    // Determine rating based on metric
    let rating = 'needs-improvement';
    if (name === 'LCP') {
      rating = median <= 2500 ? 'good' : (median <= 4000 ? 'needs-improvement' : 'poor');
    } else if (name === 'FID') {
      rating = median <= 100 ? 'good' : (median <= 300 ? 'needs-improvement' : 'poor');
    } else if (name === 'CLS') {
      rating = median <= 0.1 ? 'good' : (median <= 0.25 ? 'needs-improvement' : 'poor');
    } else if (name === 'FCP') {
      rating = median <= 1800 ? 'good' : (median <= 3000 ? 'needs-improvement' : 'poor');
    } else if (name === 'TTFB') {
      rating = median <= 800 ? 'good' : (median <= 1800 ? 'needs-improvement' : 'poor');
    }
    
    byMetric.push({
      name,
      average: avgResult.average,
      median,
      p75,
      p95,
      rating
    });
  }
  
  return {
    byMetric
  };
}

/**
 * Get custom event statistics
 */
export function getCustomEventStats(startTime: number, endTime: number): {
  byEvent: Array<{eventName: string; count: number}>;
  recent: Array<{
    eventName: string;
    timestamp: number;
    pageUrl: string;
    eventData?: Record<string, unknown>;
  }>;
} {
  const db = getDb();
  
  // Get event counts
  const byEvent = db.prepare(`
    SELECT 
      event_name as eventName, 
      COUNT(*) as count 
    FROM custom_events 
    WHERE timestamp >= ? AND timestamp <= ? 
    GROUP BY event_name 
    ORDER BY count DESC 
    LIMIT 10
  `).all(startTime, endTime);
  
  // Get recent events
  const recentEvents = db.prepare(`
    SELECT 
      event_name as eventName, 
      timestamp, 
      page_url as pageUrl, 
      event_data as eventData
    FROM custom_events 
    WHERE timestamp >= ? AND timestamp <= ? 
    ORDER BY timestamp DESC 
    LIMIT 20
  `).all(startTime, endTime);
  
  // Parse JSON event data
  const recent = recentEvents.map(event => ({
    ...event,
    eventData: event.eventData ? JSON.parse(event.eventData) : undefined
  }));
  
  return {
    byEvent,
    recent
  };
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(sortedArray.length - 1, index))];
}

/**
 * Get all dashboard data
 */
export function getDashboardData(startTime: number, endTime: number) {
  return {
    pageviews: getPageviewStats(startTime, endTime),
    referrers: getReferrerStats(startTime, endTime),
    devices: getDeviceStats(startTime, endTime),
    webVitals: getWebVitalStats(startTime, endTime),
    customEvents: getCustomEventStats(startTime, endTime),
    timeRange: {
      start: startTime,
      end: endTime
    }
  };
}
