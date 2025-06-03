import { NextRequest, NextResponse } from 'next/server';
import { insertCustomEvent } from '@/lib/db';

// Rate limiting
const rateLimits = new Map();
const RATE_LIMIT = 100; // Requests per minute
const RATE_WINDOW = 60000; // 1 minute in milliseconds

/**
 * Clean up expired rate limits
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, limit] of rateLimits.entries()) {
    if (now - limit.timestamp > RATE_WINDOW) {
      rateLimits.delete(ip);
    }
  }
}

/**
 * Handle POST requests to /api/events
 */
export async function POST(req: NextRequest) {
  try {
    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    // Apply rate limiting
    cleanupRateLimits();

    const rateLimit = rateLimits.get(ip) || { count: 0, timestamp: Date.now() };

    if (rateLimit.count >= RATE_LIMIT) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded'
      }, { status: 429 });
    }

    // Update rate limit
    rateLimits.set(ip, {
      count: rateLimit.count + 1,
      timestamp: rateLimit.timestamp
    });

    // Parse request body
    const body = await req.json();

    // Check for required fields
    if (!body.sessionId || !body.pageUrl || !body.eventName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: sessionId, pageUrl, or eventName'
      }, { status: 400 });
    }

    // Insert custom event
    const eventId = insertCustomEvent({
      sessionId: body.sessionId,
      pageUrl: body.pageUrl,
      timestamp: Date.now(),
      eventName: body.eventName,
      eventData: body.eventData
    });

    // Return success response
    return NextResponse.json({ success: true, eventId }, { status: 200 });
  } catch (error) {
    console.error('Error processing custom event:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
