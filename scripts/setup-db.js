/**
 * Database setup script for Lightweight Web Analytics
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Configuration
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'analytics.db');
const schemaPath = path.join(process.cwd(), 'schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  console.log(`Creating data directory: ${dataDir}`);
  fs.mkdirSync(dataDir, { recursive: true });
}

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
  console.log(`Removing existing database: ${dbPath}`);
  fs.unlinkSync(dbPath);
}

// Initialize database
console.log(`Setting up database at: ${dbPath}`);
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Read and execute schema
console.log('Creating database schema...');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Insert sample data for testing
console.log('Inserting sample data...');

// Insert sample user agents
const userAgentIds = {};

function insertUserAgent(browser, browserVersion, os, osVersion, deviceType, deviceVendor, deviceModel) {
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
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    deviceVendor,
    deviceModel
  );
  
  const id = result.lastInsertRowid;
  const key = `${browser}-${os}-${deviceType}`;
  userAgentIds[key] = id;
  return id;
}

// Insert common user agents
insertUserAgent('Chrome', '120.0.0', 'Windows', '10', 'desktop', null, null);
insertUserAgent('Chrome', '120.0.0', 'macOS', '14.0', 'desktop', 'Apple', null);
insertUserAgent('Safari', '17.0', 'iOS', '17.0', 'mobile', 'Apple', 'iPhone');
insertUserAgent('Firefox', '115.0', 'Linux', 'Ubuntu 22.04', 'desktop', null, null);
insertUserAgent('Edge', '120.0.0', 'Windows', '11', 'desktop', null, null);

// Generate sample pageviews
const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const pages = [
  '/',
  '/about',
  '/products',
  '/blog',
  '/contact'
];
const referrers = [
  'https://google.com',
  'https://twitter.com',
  'https://facebook.com',
  null, // direct
  'https://linkedin.com'
];
const sessionIds = [
  'session-1',
  'session-2',
  'session-3',
  'session-4',
  'session-5'
];

// Insert pageviews for the last 7 days
for (let i = 0; i < 100; i++) {
  const timestamp = now - Math.floor(Math.random() * 7 * day);
  const pageIndex = Math.floor(Math.random() * pages.length);
  const referrerIndex = Math.floor(Math.random() * referrers.length);
  const sessionIndex = Math.floor(Math.random() * sessionIds.length);
  const userAgentIndex = Math.floor(Math.random() * Object.keys(userAgentIds).length);
  const userAgentId = Object.values(userAgentIds)[userAgentIndex];
  
  db.prepare(`
    INSERT INTO pageviews (
      page_url, 
      timestamp, 
      session_id, 
      referrer, 
      ip_hash, 
      user_agent_id
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    pages[pageIndex],
    timestamp,
    sessionIds[sessionIndex],
    referrers[referrerIndex],
    `ip-hash-${Math.floor(Math.random() * 100)}`,
    userAgentId
  );
}

// Insert web vitals
const webVitalNames = ['LCP', 'FCP', 'CLS', 'FID', 'TTFB'];
const webVitalRatings = ['good', 'needs-improvement', 'poor'];

for (let i = 0; i < 50; i++) {
  const timestamp = now - Math.floor(Math.random() * 7 * day);
  const pageIndex = Math.floor(Math.random() * pages.length);
  const sessionIndex = Math.floor(Math.random() * sessionIds.length);
  const vitalIndex = Math.floor(Math.random() * webVitalNames.length);
  const ratingIndex = Math.floor(Math.random() * webVitalRatings.length);
  
  // Generate appropriate value based on the metric
  let value;
  switch (webVitalNames[vitalIndex]) {
    case 'LCP':
      value = 1000 + Math.random() * 5000; // 1-6s
      break;
    case 'FCP':
      value = 500 + Math.random() * 3000; // 0.5-3.5s
      break;
    case 'CLS':
      value = Math.random() * 0.5; // 0-0.5
      break;
    case 'FID':
      value = 10 + Math.random() * 500; // 10-510ms
      break;
    case 'TTFB':
      value = 100 + Math.random() * 2000; // 100-2100ms
      break;
    default:
      value = Math.random() * 1000;
  }
  
  db.prepare(`
    INSERT INTO web_vitals (
      session_id, 
      page_url, 
      timestamp, 
      metric_name, 
      metric_value, 
      metric_rating
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    sessionIds[sessionIndex],
    pages[pageIndex],
    timestamp,
    webVitalNames[vitalIndex],
    value,
    webVitalRatings[ratingIndex]
  );
}

// Insert custom events
const eventNames = ['click', 'scroll', 'form_submit', 'video_play', 'download'];

for (let i = 0; i < 30; i++) {
  const timestamp = now - Math.floor(Math.random() * 7 * day);
  const pageIndex = Math.floor(Math.random() * pages.length);
  const sessionIndex = Math.floor(Math.random() * sessionIds.length);
  const eventIndex = Math.floor(Math.random() * eventNames.length);
  
  // Generate sample event data
  let eventData;
  switch (eventNames[eventIndex]) {
    case 'click':
      eventData = JSON.stringify({ 
        element: ['button', 'link', 'image'][Math.floor(Math.random() * 3)],
        id: `element-${Math.floor(Math.random() * 10)}`
      });
      break;
    case 'scroll':
      eventData = JSON.stringify({ 
        depth: Math.floor(Math.random() * 100),
        direction: ['down', 'up'][Math.floor(Math.random() * 2)]
      });
      break;
    case 'form_submit':
      eventData = JSON.stringify({ 
        form_id: `form-${Math.floor(Math.random() * 5)}`,
        success: Math.random() > 0.2
      });
      break;
    default:
      eventData = null;
  }
  
  db.prepare(`
    INSERT INTO custom_events (
      session_id, 
      page_url, 
      timestamp, 
      event_name, 
      event_data
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    sessionIds[sessionIndex],
    pages[pageIndex],
    timestamp,
    eventNames[eventIndex],
    eventData
  );
}

console.log('Database setup complete!');
console.log(`- Database location: ${dbPath}`);
console.log(`- Sample data inserted: 100 pageviews, 50 web vitals, 30 custom events`);
console.log('You can now start the application.');

// Close the database connection
db.close();