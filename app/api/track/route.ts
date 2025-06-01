import { NextRequest, NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';
import { 
  insertPageview, 
  insertUserAgent, 
  insertWebVitals 
} from '@/lib/db';
import { BeaconPayload, UserAgentData, WebVitalMetric } from '@/lib/types';

// Rate limiting map: IP -> {count, timestamp}
const rateLimits = new Map<string, {count: number, timestamp: number}>();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || '100', 10);
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

/**
 * Validate web vitals data
 */
function validateWebVitals(webVitals?: WebVitalMetric[]): WebVitalMetric[] {
  if (!webVitals || !Array.isArray(webVitals)) {
    return [];
  }
  
  return webVitals.filter(metric => {
    // Validate metric name
    if (!['LCP', 'FCP', 'CLS', 'FID', 'TTFB'].includes(metric.name)) {
      return false;
    }
    
    // Validate metric value
    if (typeof metric.value !== 'number' || isNaN(metric.value)) {
      return false;
    }
    
    // Validate rating if present
    if (
      metric.rating && 
      !['good', 'needs-improvement', 'poor'].includes(metric.rating)
    ) {
      return false;
    }
    
    return true;
  });
}

/**
 * Parse user agent string
 */
function parseUserAgent(userAgentString: string): UserAgentData {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  
  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version,
    os: result.os.name,
    osVersion: result.os.version,
    deviceType: result.device.type || 'desktop',
    deviceVendor: result.device.vendor,
    deviceModel: result.device.model
  };
}

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
 * POST /api/track - Track pageviews and web vitals
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
    const body: BeaconPayload = await request.json();
    
    // Validate required fields
    if (!body.pageUrl || !body.timestamp || !body.sessionId || !body.userAgent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Parse user agent
    const userAgentData = parseUserAgent(body.userAgent);
    const userAgentId = insertUserAgent(userAgentData);
    
    // Insert pageview
    insertPageview(
      {
        pageUrl: body.pageUrl,
        timestamp: body.timestamp,
        sessionId: body.sessionId,
        referrer: body.referrer,
        userAgent: body.userAgent
      },
      ip,
      userAgentId
    );
    
    // Insert web vitals if present
    const validWebVitals = validateWebVitals(body.webVitals);
    if (validWebVitals.length > 0) {
      insertWebVitals(validWebVitals, body.sessionId, body.pageUrl);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking pageview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
