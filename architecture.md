# Lightweight Web Analytics - Architecture Design

## Overview

Lightweight Web Analytics is designed as a self-hostable alternative to Vercel Analytics, specifically for Next.js developers. The platform focuses on core web vitals, pageviews, referrers, and device/browser metrics, with a minimalist dashboard for visualization.

## System Architecture

### High-Level Components

1. **Tracking Snippet** (`analytics.js`)
   - Lightweight JavaScript (< 1KB minified)
   - Collects core web vitals and user metrics
   - Sends data via `navigator.sendBeacon` or `fetch` fallback

2. **Next.js Backend**
   - API Routes/Route Handlers for data collection
   - Server Components for dashboard rendering
   - Authentication for dashboard access

3. **SQLite Database**
   - Lightweight, file-based storage
   - Indexed tables for efficient queries
   - Data retention policies

4. **Dashboard**
   - Minimalist UI with Chart.js visualizations
   - Server-side rendering for performance
   - Responsive design with Tailwind CSS

### Data Flow

```
User Browser → Tracking Snippet → Next.js API Routes → SQLite Database
                                                     ↑
Dashboard UI ← Next.js Server Components ← Aggregation Queries
```

## Database Schema

### Tables

1. **pageviews**
   ```sql
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
   ```

2. **web_vitals**
   ```sql
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
   ```

3. **user_agents**
   ```sql
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
   ```

4. **custom_events**
   ```sql
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
   ```

### Indexing Strategy

- Timestamp indexes for efficient time-based queries (O(log n))
- Page URL indexes for filtering by page (O(log n))
- Session ID indexes for tracking user journeys (O(log n))
- Metric name and event name indexes for filtering by type (O(log n))

## API Routes

1. **Track Pageview** (`POST /api/track`)
   - Receives pageview data and web vitals
   - Validates and sanitizes input
   - Stores in SQLite database

2. **Track Custom Event** (`POST /api/events`)
   - Receives custom event data
   - Validates and sanitizes input
   - Stores in SQLite database

3. **Dashboard Data** (`GET /api/dashboard/*`)
   - Authenticated endpoints for dashboard data
   - Aggregated metrics with efficient queries
   - Time-based filtering

## Privacy and Security

1. **IP Anonymization**
   - Hash IP addresses with salt before storage
   - Salt stored in environment variable

2. **Data Validation**
   - Validate all incoming data
   - Use prepared statements for SQLite queries

3. **Authentication**
   - Basic authentication for dashboard access
   - Environment variable-based credentials

4. **Rate Limiting**
   - Limit requests per IP to prevent abuse
   - Configurable via environment variables

## Performance Considerations

1. **Tracking Snippet**
   - Minified to < 1KB
   - Asynchronous loading
   - Use of `navigator.sendBeacon` for non-blocking sends

2. **Database Queries**
   - Indexed lookups for O(log n) complexity
   - Prepared statements for query efficiency
   - Connection pooling for concurrent requests

3. **Dashboard Rendering**
   - Server Components for minimal client-side JS
   - Efficient data aggregation queries
   - Pagination for large datasets

## Deployment Architecture

1. **Single-Server Deployment**
   - Docker container for isolation
   - Volume mounting for database persistence
   - Environment variables for configuration

2. **Resource Requirements**
   - < 100MB memory footprint
   - Minimal CPU usage
   - SQLite file-based storage with size limits

## Extensibility

1. **Custom Events**
   - Flexible schema for various event types
   - JSON storage for event metadata

2. **Storage Backends**
   - Abstracted database layer
   - Potential for alternative backends (PostgreSQL, MySQL)

3. **Additional Metrics**
   - Extensible schema for new metrics
   - Modular dashboard components
