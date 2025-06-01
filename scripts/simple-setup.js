/**
 * Simple database setup script for Lightweight Web Analytics
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Configuration
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'analytics.db');

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

// Create tables directly
console.log('Creating database schema...');

// User Agents table
db.exec(`
  CREATE TABLE user_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    browser TEXT NOT NULL,
    browser_version TEXT,
    os TEXT,
    os_version TEXT,
    device_type TEXT,
    device_vendor TEXT,
    device_model TEXT
  );
  CREATE INDEX idx_user_agents_browser ON user_agents(browser);
  CREATE INDEX idx_user_agents_os ON user_agents(os);
  CREATE INDEX idx_user_agents_device_type ON user_agents(device_type);
`);

// Pageviews table
db.exec(`
  CREATE TABLE pageviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_url TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    referrer TEXT,
    ip_hash TEXT,
    user_agent_id INTEGER,
    FOREIGN KEY (user_agent_id) REFERENCES user_agents(id)
  );
  CREATE INDEX idx_pageviews_timestamp ON pageviews(timestamp);
  CREATE INDEX idx_pageviews_page_url ON pageviews(page_url);
  CREATE INDEX idx_pageviews_session_id ON pageviews(session_id);
`);

// Web Vitals table
db.exec(`
  CREATE TABLE web_vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_rating TEXT
  );
  CREATE INDEX idx_web_vitals_timestamp ON web_vitals(timestamp);
  CREATE INDEX idx_web_vitals_page_url ON web_vitals(page_url);
  CREATE INDEX idx_web_vitals_metric_name ON web_vitals(metric_name);
`);

// Custom Events table
db.exec(`
  CREATE TABLE custom_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    event_name TEXT NOT NULL,
    event_data TEXT
  );
  CREATE INDEX idx_custom_events_timestamp ON custom_events(timestamp);
  CREATE INDEX idx_custom_events_event_name ON custom_events(event_name);
`);

// Data Retention trigger
db.exec(`
  CREATE TRIGGER cleanup_old_data AFTER INSERT ON pageviews
  BEGIN
    DELETE FROM pageviews WHERE timestamp < (strftime('%s', 'now') * 1000) - (30 * 24 * 60 * 60 * 1000);
    DELETE FROM web_vitals WHERE timestamp < (strftime('%s', 'now') * 1000) - (30 * 24 * 60 * 60 * 1000);
    DELETE FROM custom_events WHERE timestamp < (strftime('%s', 'now') * 1000) - (30 * 24 * 60 * 60 * 1000);
    DELETE FROM user_agents WHERE id NOT IN (SELECT DISTINCT user_agent_id FROM pageviews);
  END;
`);

console.log('Database setup complete!');
console.log(`- Database location: ${dbPath}`);
console.log('You can now start the application.');

// Close the database connection
db.close();