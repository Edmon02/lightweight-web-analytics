# Lightweight Web Analytics

A privacy-focused, self-hostable web analytics platform designed as an alternative to Vercel Analytics for Next.js developers. This platform uses Next.js App Router for the backend and stores data in a lightweight SQLite database suitable for single-server deployment.

## Features

- **Core Web Vitals Tracking**: Monitors LCP, FCP, CLS, and other performance metrics
- **Pageview Analytics**: Tracks pageviews, referrers, and user journeys
- **Device & Browser Breakdown**: Analyzes visitor device types and browsers
- **Custom Event Tracking**: Supports tracking custom events with metadata
- **Privacy-Focused**: Anonymizes IP addresses and avoids storing PII
- **Lightweight**: < 1KB tracking snippet, minimal server requirements
- **Self-Hostable**: Easy deployment with Docker on a single server
- **Type-Safe**: Written in TypeScript with strict type checking

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lightweight-web-analytics.git
   cd lightweight-web-analytics
   ```

2. Configure environment variables in `docker-compose.yml`:
   ```yaml
   environment:
     - IP_HASH_SALT=your-random-string
     - DASHBOARD_USERNAME=your-username
     - DASHBOARD_PASSWORD=your-password
   ```

3. Start the container:
   ```bash
   docker-compose up -d
   ```

4. Access the dashboard at `http://localhost:3000/dashboard`

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lightweight-web-analytics.git
   cd lightweight-web-analytics
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Create a `.env.local` file:
   ```
   DB_PATH=./data/analytics.db
   IP_HASH_SALT=your-random-string
   DASHBOARD_USERNAME=your-username
   DASHBOARD_PASSWORD=your-password
   RATE_LIMIT=100
   ```

4. Build and start the application:
   ```bash
   bun run build
   bun run start
   ```

5. Access the dashboard at `http://localhost:3000/dashboard`

## Integrating the Tracking Snippet

Add the following script to your Next.js application's `<head>` section:

```html
<script async src="https://your-analytics-domain.com/analytics.js"></script>
```

For Next.js applications, add it to your `_document.js` or `layout.js`:

```jsx
// In app/layout.js (App Router)
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your App',
  description: 'Your app description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script async src="https://your-analytics-domain.com/analytics.js"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Tracking Custom Events

You can track custom events using the global `lwaTrackEvent` function:

```javascript
// Track a button click
lwaTrackEvent('button_click', { buttonId: 'signup', section: 'hero' });

// Track a form submission
lwaTrackEvent('form_submit', { formId: 'contact', success: true });
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PATH` | Path to SQLite database file | `./data/analytics.db` |
| `IP_HASH_SALT` | Salt for IP address hashing | Required |
| `DASHBOARD_USERNAME` | Dashboard login username | Required |
| `DASHBOARD_PASSWORD` | Dashboard login password | Required |
| `RATE_LIMIT` | Maximum requests per minute per IP | `100` |

### Data Retention

By default, data is retained for 30 days. You can modify this by editing the trigger in `schema.sql`:

```sql
-- Change 30 to your desired number of days
DELETE FROM pageviews WHERE timestamp < (strftime('%s', 'now') * 1000) - (30 * 24 * 60 * 60 * 1000);
```

## Architecture

### Project Structure

```
lightweight-web-analytics/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── track/            # Pageview tracking endpoint
│   │   ├── events/           # Custom events endpoint
│   │   └── dashboard/        # Dashboard data endpoints
│   └── dashboard/            # Dashboard UI
├── lib/                      # Shared libraries
│   ├── db/                   # Database utilities
│   └── utils/                # Helper functions
├── public/                   # Static assets
│   └── analytics.js          # Tracking snippet
├── schema.sql                # SQLite schema
├── Dockerfile                # Docker configuration
└── docker-compose.yml        # Docker Compose configuration
```

### Database Schema

The platform uses SQLite with the following tables:

- `pageviews`: Stores page visit information
- `web_vitals`: Stores performance metrics
- `user_agents`: Stores parsed user agent data
- `custom_events`: Stores user-defined events

Each table is indexed for efficient querying, with O(log n) lookup complexity.

## Performance Considerations

### Tracking Snippet

- Minified to < 1KB
- Uses `navigator.sendBeacon` for non-blocking sends
- Falls back to `fetch` with `keepalive` when `sendBeacon` is unavailable
- Asynchronously loads web-vitals library

### Server-Side

- Indexed SQLite queries for efficient data retrieval
- Rate limiting to prevent abuse
- Connection pooling for concurrent requests
- Server Components for minimal client-side JavaScript

## Privacy

- IP addresses are hashed with a salt before storage
- No cookies are used for tracking (only for dashboard authentication)
- No personally identifiable information is stored
- Session IDs are randomly generated and not linked to user identity
- Data is automatically deleted after 30 days by default

## Troubleshooting

### Dashboard Shows No Data

1. Check that the tracking snippet is correctly installed
2. Verify that the API endpoints are accessible
3. Check browser console for any errors
4. Ensure the database file exists and has correct permissions

### Rate Limiting Issues

If you're experiencing rate limiting errors:

1. Increase the `RATE_LIMIT` environment variable
2. Check for any scripts that might be making excessive requests

### Database Growth

If your database is growing too large:

1. Decrease the data retention period in `schema.sql`
2. Run a manual cleanup query to remove old data

## Development

### Prerequisites

- Node.js 18+
- Bun package manager
- SQLite

### Setup

1. Clone the repository
2. Install dependencies: `bun install`
3. Create a `.env.local` file with required variables
4. Start development server: `bun run dev`

### Running Tests

```bash
bun run test
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
