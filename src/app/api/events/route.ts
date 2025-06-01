import { NextRequest, NextResponse } from 'next/server';
import { insertCustomEvent } from '@/lib/db';
import { CustomEventData } from '@/lib/types';

// Rate limiting map: IP -> {count, timestamp}
const rateLimits = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || '100', 10);
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

/**
 * Check rate limit for an IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  // If no previous requests or window expired, reset counter
  if (!limit || now - limit.timestamp > RATE_WINDOW) {
    rateLimits.set(ip, { count: 1, timestamp: now });
    return true;
  }

  // If under limit, increment counter
  if (limit.count < RATE_LIMIT) {
    rateLimits.set(ip, { count: limit.count + 1, timestamp: limit.timestamp });
    return true;
  }

  // Rate limit exceeded
  return false;
}

/**
 * Clean up old rate limit entries (called periodically)
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, limit] of rateLimits.entries()) {
    if (now - limit.timestamp > RATE_WINDOW) {
      rateLimits.delete(ip);
    }
  }
}

// Clean up rate limits every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

/**
 * POST /api/events - Track custom events
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse request body
    const body: CustomEventData = await request.json();

    // Validate required fields
    if (!body.eventName || !body.pageUrl || !body.timestamp || !body.sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate event data if present
    if (body.eventData && typeof body.eventData !== 'object') {
      return NextResponse.json(
        { error: 'Event data must be an object' },
        { status: 400 }
      );
    }

    // Insert custom event
    insertCustomEvent(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking custom event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
