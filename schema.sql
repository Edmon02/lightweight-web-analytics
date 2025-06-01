-- Lightweight Web Analytics - SQLite Schema

-- Pageviews table - stores information about page visits
CREATE TABLE pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_url TEXT NOT NULL,
  timestamp INTEGER NOT NULL, -- Unix timestamp in milliseconds
  session_id TEXT NOT NULL,   -- Anonymous session identifier
  referrer TEXT,              -- Where the visitor came from
  ip_hash TEXT,               -- Anonymized IP address (hashed)
  user_agent_id INTEGER,      -- Foreign key to user_agents table
  FOREIGN KEY (user_agent_id) REFERENCES user_agents(id)
);
-- Indexes for efficient querying
CREATE INDEX idx_pageviews_timestamp ON pageviews(timestamp);
CREATE INDEX idx_pageviews_page_url ON pageviews(page_url);
CREATE INDEX idx_pageviews_session_id ON pageviews(session_id);

-- Web Vitals table - stores core web vitals metrics
CREATE TABLE web_vitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  metric_name TEXT NOT NULL,  -- LCP, FCP, CLS, etc.
  metric_value REAL NOT NULL, -- Numeric value of the metric
  metric_rating TEXT          -- "good", "needs-improvement", "poor"
);
-- Indexes for efficient querying
CREATE INDEX idx_web_vitals_timestamp ON web_vitals(timestamp);
CREATE INDEX idx_web_vitals_page_url ON web_vitals(page_url);
CREATE INDEX idx_web_vitals_metric_name ON web_vitals(metric_name);

-- User Agents table - stores parsed user agent information
CREATE TABLE user_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  browser TEXT NOT NULL,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  device_type TEXT,           -- "desktop", "mobile", "tablet", etc.
  device_vendor TEXT,
  device_model TEXT
);
-- Indexes for efficient querying
CREATE INDEX idx_user_agents_browser ON user_agents(browser);
CREATE INDEX idx_user_agents_os ON user_agents(os);
CREATE INDEX idx_user_agents_device_type ON user_agents(device_type);

-- Custom Events table - stores user-defined events
CREATE TABLE custom_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  event_name TEXT NOT NULL,   -- Name of the custom event
  event_data TEXT             -- JSON string of event metadata
);
-- Indexes for efficient querying
CREATE INDEX idx_custom_events_timestamp ON custom_events(timestamp);
CREATE INDEX idx_custom_events_event_name ON custom_events(event_name);

-- Data Retention trigger - automatically deletes data older than 30 days
CREATE TRIGGER cleanup_old_data AFTER INSERT ON pageviews
BEGIN
  -- Delete pageviews older than 30 days
  DELETE FROM pageviews WHERE timestamp < (strftime('%s', 'now') * 1000) - (30 * 24 * 60 * 60 * 1000);
  
  -- Delete web vitals older than 30 days
  DELETE FROM web_vitals WHERE timestamp < (strftime('%s', 'now') * 1000) - (30 * 24 * 60 * 60 * 1000);
  
  -- Delete custom events older than 30 days
  DELETE FROM custom_events WHERE timestamp < (strftime('%s', 'now') * 1000) - (30 * 24 * 60 * 60 * 1000);
  
  -- Clean up unused user agents
  DELETE FROM user_agents WHERE id NOT IN (SELECT DISTINCT user_agent_id FROM pageviews);
END;
