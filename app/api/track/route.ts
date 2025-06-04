import { NextRequest, NextResponse } from 'next/server';
import { insertUserAgent, insertPageview, insertWebVitals } from '@/lib/db';
import { UAParser } from 'ua-parser-js';

// Rate limiting
export const rateLimits = new Map();
export const RATE_LIMIT = 100; // Requests per minute
export const RATE_WINDOW = 60000; // 1 minute in milliseconds

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
 * Handle POST requests to /api/track
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
    if (!body.sessionId || !body.pageUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: sessionId or pageUrl'
      }, { status: 400 });
    }

    // Parse user agent
    const userAgent = req.headers.get('user-agent') || '';
    const parser = new UAParser(userAgent);
    const parsedUA = parser.getResult();

    // Insert user agent
    const userAgentId = insertUserAgent({
      browser: parsedUA.browser.name || 'Unknown',
      browserVersion: parsedUA.browser.version,
      os: parsedUA.os.name,
      osVersion: parsedUA.os.version,
      deviceType: parsedUA.device.type || 'desktop',
      deviceVendor: parsedUA.device.vendor,
      deviceModel: parsedUA.device.model
    });

    // Insert pageview
    const pageviewId = insertPageview({
      pageUrl: body.pageUrl,
      timestamp: Date.now(),
      sessionId: body.sessionId,
      referrer: body.referrer
    }, ip, userAgentId);

    // Process web vitals if provided
    let validWebVitals = [];
    if (body.webVitals && Array.isArray(body.webVitals)) {
      validWebVitals = body.webVitals.filter(metric =>
        metric &&
        typeof metric.name === 'string' &&
        typeof metric.value === 'number'
      );

      if (validWebVitals.length > 0) {
        insertWebVitals(validWebVitals, body.sessionId, body.pageUrl);
      } else {
        // If webVitals was provided but invalid, still log empty array
        insertWebVitals([], body.sessionId, body.pageUrl);
      }
    }

    // Return success response with pageviewId
    return NextResponse.json({ success: true, pageviewId: pageviewId }, { status: 200 });
  } catch (error) {
    console.error('Error processing pageview:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
