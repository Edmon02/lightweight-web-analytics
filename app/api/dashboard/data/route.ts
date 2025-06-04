import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/db';

// Basic authentication middleware
function basicAuth(req: NextRequest) {
  // Get auth header
  const authHeader = req.headers.get('authorization');

  // Check if auth is required
  const username = process.env.DASHBOARD_USERNAME;
  const password = process.env.DASHBOARD_PASSWORD;

  // If credentials are not set, skip auth
  if (!username || !password) {
    return true;
  }

  // Check auth header
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  // Decode credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [providedUsername, providedPassword] = credentials.split(':');

  // Validate credentials
  return providedUsername === username && providedPassword === password;
}

/**
 * GET /api/dashboard/data - Get dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!basicAuth(request)) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Lightweight Web Analytics Dashboard"'
        }
      });
    }

    // Parse time range from query parameters
    const searchParams = request.nextUrl.searchParams;
    const startTimeParam = searchParams.get('start');
    const endTimeParam = searchParams.get('end');

    // Default to last 7 days if not specified
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const startTime = startTimeParam ? parseInt(startTimeParam, 10) : now - (7 * oneDay);
    const endTime = endTimeParam ? parseInt(endTimeParam, 10) : now;

    // Get dashboard data
    const data = getDashboardData(startTime, endTime);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
