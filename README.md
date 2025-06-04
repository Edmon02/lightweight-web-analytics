# Lightweight Web Analytics

A privacy-focused, self-hostable web analytics platform built with Next.js and SQLite.

## Features

- **Lightweight**: Tracking script is less than 1KB minified
- **Privacy-focused**: No cookies, IP anonymization, and minimal data collection
- **Core Web Vitals**: Track LCP, FID, CLS, and other performance metrics
- **Easy to integrate**: Simple script tag to add to your Next.js application
- **Self-hostable**: Run on your own infrastructure with Docker
- **Dashboard**: Visual analytics with Chart.js
- **Type-safe**: Built with TypeScript for robust code
- **SQLite storage**: Simple, file-based database with no external dependencies

## Quick Start

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Edmon02/lightweight-web-analytics.git
cd lightweight-web-analytics
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
bun install
```

3. Create a `.env.local` file based on the example:
```bash
cp .env.example .env.local
```

4. Set up the database:
```bash
npm run db:setup
# or
yarn db:setup
# or
bun db:setup
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000) to view the landing page.
7. Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view the analytics dashboard.

### Production Deployment

#### Using Docker

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Access the dashboard at `http://your-server-ip:3000/dashboard`

#### Manual Deployment

1. Build the application:
```bash
npm run build
# or
yarn build
# or
bun build
```

2. Start the production server:
```bash
npm start
# or
yarn start
# or
bun start
```

## Integration

Add the following script to your Next.js application's `_document.js` or `_app.js`:

```javascript
<script 
  src="https://your-analytics-domain.com/analytics.js" 
  data-host="https://your-analytics-domain.com"
  async 
  defer
></script>
```

For Next.js 13+ App Router, add it to your `layout.js` or `template.js`:

```javascript
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
        <Script
          src="https://your-analytics-domain.com/analytics.js"
          data-host="https://your-analytics-domain.com"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
```

## Custom Events

You can track custom events using the global `lwa` object:

```javascript
// Track a simple event
lwa('event', 'button_click');

// Track an event with data
lwa('event', 'form_submit', { 
  formId: 'contact',
  fields: 3,
  timeToComplete: 45
});
```

## API Reference

### Tracking Endpoint

`POST /api/track`

Tracks pageviews and web vitals.

**Request Body:**
```json
{
  "sessionId": "unique-session-id",
  "pageUrl": "/current-page",
  "referrer": "https://referring-site.com",
  "webVitals": [
    { "name": "LCP", "value": 2500, "rating": "good" },
    { "name": "FID", "value": 100, "rating": "good" },
    { "name": "CLS", "value": 0.1, "rating": "good" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "pageviewId": 123
}
```

### Events Endpoint

`POST /api/events`

Tracks custom events.

**Request Body:**
```json
{
  "sessionId": "unique-session-id",
  "pageUrl": "/current-page",
  "eventName": "button_click",
  "eventData": {
    "buttonId": "submit",
    "position": { "x": 100, "y": 200 }
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": 123
}
```

### Dashboard Data Endpoint

`GET /api/dashboard/data`

Retrieves analytics data for the dashboard.

**Query Parameters:**
- `start`: Start timestamp (milliseconds)
- `end`: End timestamp (milliseconds)

**Response:**
```json
{
  "pageviews": {
    "total": 1234,
    "byDay": [
      { "date": "2025-06-01", "count": 123 },
      { "date": "2025-06-02", "count": 145 }
    ],
    "byPage": [
      { "page": "/", "count": 456 },
      { "page": "/about", "count": 123 }
    ]
  },
  "referrers": {
    "byReferrer": [
      { "referrer": "google.com", "count": 234 },
      { "referrer": "twitter.com", "count": 123 }
    ]
  },
  "devices": {
    "byBrowser": [
      { "browser": "Chrome", "count": 567 },
      { "browser": "Firefox", "count": 234 }
    ],
    "byOS": [
      { "os": "Windows", "count": 456 },
      { "os": "MacOS", "count": 345 }
    ],
    "byDeviceType": [
      { "deviceType": "desktop", "count": 789 },
      { "deviceType": "mobile", "count": 456 }
    ]
  },
  "webVitals": {
    "byMetric": [
      {
        "name": "LCP",
        "average": 2345.67,
        "median": 2100.0,
        "p75": 2800.0,
        "p95": 3500.0,
        "rating": "good"
      }
    ]
  },
  "customEvents": {
    "byEvent": [
      { "eventName": "button_click", "count": 234 },
      { "eventName": "form_submit", "count": 123 }
    ],
    "recent": [
      {
        "eventName": "button_click",
        "timestamp": 1717027200000,
        "pageUrl": "/products",
        "eventData": { "buttonId": "add-to-cart" }
      }
    ]
  }
}
```

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```
# Database path (absolute path recommended for production)
DB_PATH=./data/analytics.db

# Salt for IP address hashing (change this to a random string)
IP_HASH_SALT=change-this-to-a-random-string

# Dashboard authentication
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=change-this-password

# Rate limiting (requests per minute per IP)
RATE_LIMIT=100
```

## Database Schema

The SQLite database has the following tables:

### pageviews
- `id`: INTEGER PRIMARY KEY
- `page_url`: TEXT NOT NULL
- `timestamp`: INTEGER NOT NULL
- `session_id`: TEXT NOT NULL
- `referrer`: TEXT
- `ip_hash`: TEXT NOT NULL
- `user_agent_id`: INTEGER NOT NULL

### user_agents
- `id`: INTEGER PRIMARY KEY
- `browser`: TEXT NOT NULL
- `browser_version`: TEXT
- `os`: TEXT
- `os_version`: TEXT
- `device_type`: TEXT
- `device_vendor`: TEXT
- `device_model`: TEXT

### web_vitals
- `id`: INTEGER PRIMARY KEY
- `session_id`: TEXT NOT NULL
- `page_url`: TEXT NOT NULL
- `timestamp`: INTEGER NOT NULL
- `metric_name`: TEXT NOT NULL
- `metric_value`: REAL NOT NULL
- `metric_rating`: TEXT

### custom_events
- `id`: INTEGER PRIMARY KEY
- `session_id`: TEXT NOT NULL
- `page_url`: TEXT NOT NULL
- `timestamp`: INTEGER NOT NULL
- `event_name`: TEXT NOT NULL
- `event_data`: TEXT

## Development

### Project Structure

```
lightweight-web-analytics/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── dashboard/      # Dashboard API
│   │   ├── events/         # Custom events API
│   │   └── track/          # Pageview tracking API
│   ├── dashboard/          # Dashboard UI
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── lib/                    # Shared libraries
│   ├── db/                 # Database utilities
│   ├── types.ts            # TypeScript types
│   └── utils/              # Utility functions
├── public/                 # Static assets
│   └── analytics.js        # Tracking script
├── scripts/                # Utility scripts
│   └── setup-db.js         # Database setup
├── tests/                  # Test files
├── .env.example            # Example environment variables
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker configuration
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies and scripts
├── schema.sql              # Database schema
└── tsconfig.json           # TypeScript configuration
```

### Running Tests

```bash
npm test
# or
yarn test
# or
bun test
```

## License

MIT
