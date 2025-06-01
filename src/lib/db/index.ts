/**
 * Database utility for SQLite operations
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  PageviewData,
  WebVitalMetric,
  UserAgentData,
  CustomEventData,
  WebVitalName,
  WebVitalRating,
  WebVitalStats,
  CustomEventStats,
  DashboardData
} from '../types';
import {
  DbConfig,
  PageviewQueryResult,
  ReferrerQueryResult,
  WebVitalQueryResult,
  METRIC_THRESHOLDS
} from './types';

// Database configuration
const dbConfig: DbConfig = {
  path: process.env.DB_PATH || path.join(process.cwd(), 'data', 'analytics.db'),
  hashSalt: process.env.IP_HASH_SALT || 'default-salt-change-me'
};

// Ensure data directory exists
const dataDir = path.dirname(dbConfig.path);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database connection with WAL mode for better concurrency
let db: Database.Database | null = null;

/**
 * Initialize database connection and schema
 */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbConfig.path);

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Check if tables exist, if not create them
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='pageviews'"
    ).get() as { name: string } | undefined;

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
  return crypto
    .createHash('sha256')
    .update(ip + dbConfig.hashSalt)
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
  ) as { id: number };

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
  byDay: Array<{ date: string; count: number }>;
  byPage: Array<{ page: string; count: number }>;
} {
  const db = getDb();

  // Get total pageviews
  const totalResult = db.prepare(`
    SELECT COUNT(*) as count FROM pageviews 
    WHERE timestamp >= ? AND timestamp <= ?
  `).get(startTime, endTime) as PageviewQueryResult;
  const total = totalResult.count;

  // Get pageviews by day
  const byDay = db.prepare(`
    SELECT 
      date(timestamp/1000, 'unixepoch') as date, 
      COUNT(*) as count 
    FROM pageviews 
    WHERE timestamp >= ? AND timestamp <= ? 
    GROUP BY date 
    ORDER BY date
  `).all(startTime, endTime) as Array<{ date: string; count: number }>;

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
  `).all(startTime, endTime) as Array<{ page: string; count: number }>;

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
  byReferrer: Array<{ referrer: string; count: number }>;
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
  `).all(startTime, endTime) as Array<ReferrerQueryResult>;

  return {
    byReferrer
  };
}

/**
 * Get device statistics
 */
export function getDeviceStats(startTime: number, endTime: number): {
  byBrowser: Array<{ browser: string; count: number }>;
  byOS: Array<{ os: string; count: number }>;
  byDeviceType: Array<{ deviceType: string; count: number }>;
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
  `).all(startTime, endTime) as Array<{ browser: string; count: number }>;

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
  `).all(startTime, endTime) as Array<{ os: string; count: number }>;

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
  `).all(startTime, endTime) as Array<{ deviceType: string; count: number }>;

  return {
    byBrowser,
    byOS,
    byDeviceType
  };
}

/**
 * Get web vitals statistics
 */
export function getWebVitalStats(startTime: number, endTime: number): WebVitalStats {
  const db = getDb();

  // Get metrics
  const metrics = db.prepare(`
    SELECT DISTINCT metric_name FROM web_vitals
    WHERE timestamp >= ? AND timestamp <= ?
  `).all(startTime, endTime) as Array<{ metric_name: WebVitalName }>;

  const byMetric: Array<{
    name: WebVitalName;
    average: number;
    median: number;
    p75: number;
    p95: number;
    rating: WebVitalRating;
  }> = [];

  for (const metric of metrics) {
    const name = metric.metric_name;
    const threshold = METRIC_THRESHOLDS[name];

    // Get average
    const avgResult = db.prepare(`
      SELECT AVG(metric_value) as average FROM web_vitals
      WHERE metric_name = ? AND timestamp >= ? AND timestamp <= ?
    `).get(name, startTime, endTime) as WebVitalQueryResult;

    // Get all values for percentile calculations
    const values = db.prepare(`
      SELECT metric_value FROM web_vitals
      WHERE metric_name = ? AND timestamp >= ? AND timestamp <= ?
      ORDER BY metric_value
    `).all(name, startTime, endTime) as Array<{ metric_value: number }>;

    // Calculate percentiles
    const sortedValues = values.map(v => v.metric_value);
    const median = calculatePercentile(sortedValues, 50);
    const p75 = calculatePercentile(sortedValues, 75);
    const p95 = calculatePercentile(sortedValues, 95);

    // Determine rating based on metric thresholds
    const rating: WebVitalRating = (
      median <= threshold.good ? 'good' :
        median <= threshold.needsImprovement ? 'needs-improvement' :
          'poor'
    );

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
export function getCustomEventStats(startTime: number, endTime: number): CustomEventStats {
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
  `).all(startTime, endTime) as Array<{ eventName: string; count: number }>;

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
  `).all(startTime, endTime) as Array<{
    eventName: string;
    timestamp: number;
    pageUrl: string;
    eventData?: string;
  }>;

  // Parse JSON event data
  const recent = recentEvents.map(event => ({
    eventName: event.eventName,
    timestamp: event.timestamp,
    pageUrl: event.pageUrl,
    eventData: event.eventData ? JSON.parse(event.eventData) as Record<string, unknown> : undefined
  }));

  return {
    byEvent,
    recent
  };
}

/**
 * Calculate percentile from sorted array of numbers
 * @param sortedArray The array of numbers, must be sorted in ascending order
 * @param percentile The percentile to calculate (0-100)
 * @returns The value at the given percentile
 */
function calculatePercentile(sortedArray: readonly number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  if (percentile < 0 || percentile > 100) throw new Error('Percentile must be between 0 and 100');

  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(sortedArray.length - 1, index))];
}

/**
 * Get all dashboard data
 */
export function getDashboardData(startTime: number, endTime: number): DashboardData {
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
