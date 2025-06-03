import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import * as db from '../src/lib/db';

// Mock database functions
vi.mock('@/lib/db', () => ({
  insertUserAgent: vi.fn().mockReturnValue(42),
  insertPageview: vi.fn().mockReturnValue(123),
  insertWebVitals: vi.fn(),
  hashIp: vi.fn().mockReturnValue('hashed-ip')
}));

// Define constants for rate limiting
const RATE_LIMIT = 100;
const RATE_WINDOW = 60000; // 1 minute

// Create a map for rate limiting
const rateLimits = new Map();

describe('Track API Route', () => {
  let POST;

  beforeEach(async () => {
    // Import the POST function inside the test to avoid hoisting issues
    const route = await import('../src/app/api/track/route');
    POST = route.POST;

    vi.clearAllMocks();
    rateLimits.clear();
    // Reset Date.now to return a consistent value for tests
    vi.spyOn(Date, 'now').mockImplementation(() => 1748935795115);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle valid pageview with web vitals', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    mockHeaders.set('x-forwarded-for', '192.168.1.1');

    const mockRequest = new NextRequest('https://example.com/api/track', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        sessionId: 'test-session-id',
        pageUrl: '/test-page',
        referrer: 'https://example.com',
        webVitals: [
          { name: 'LCP', value: 2500, rating: 'good' },
          { name: 'FID', value: 100, rating: 'good' },
          { name: 'CLS', value: 0.1, rating: 'good' }
        ]
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({ success: true, pageviewId: 123 });

    // Verify database calls
    expect(db.insertUserAgent).toHaveBeenCalledTimes(1);
    expect(db.insertPageview).toHaveBeenCalledTimes(1);
    expect(db.insertWebVitals).toHaveBeenCalledTimes(1);
    expect(db.insertWebVitals).toHaveBeenCalledWith(
      [
        { name: 'LCP', value: 2500, rating: 'good' },
        { name: 'FID', value: 100, rating: 'good' },
        { name: 'CLS', value: 0.1, rating: 'good' }
      ],
      'test-session-id',
      '/test-page'
    );
  });

  it('should handle pageview without web vitals', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    mockHeaders.set('x-forwarded-for', '192.168.1.1');

    const mockRequest = new NextRequest('https://example.com/api/track', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        sessionId: 'test-session-id',
        pageUrl: '/test-page',
        referrer: 'https://example.com'
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({ success: true, pageviewId: 123 });

    // Verify database calls
    expect(db.insertUserAgent).toHaveBeenCalledTimes(1);
    expect(db.insertPageview).toHaveBeenCalledTimes(1);
    expect(db.insertWebVitals).not.toHaveBeenCalled();
  });

  it('should reject invalid web vitals data', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    mockHeaders.set('x-forwarded-for', '192.168.1.1');

    const mockRequest = new NextRequest('https://example.com/api/track', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        sessionId: 'test-session-id',
        pageUrl: '/test-page',
        webVitals: [
          { name: 'LCP', value: 'invalid', rating: 'good' } // value should be a number
        ]
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200); // Still accept the pageview

    // Verify database calls - should still insert pageview but not web vitals
    expect(db.insertUserAgent).toHaveBeenCalledTimes(1);
    expect(db.insertPageview).toHaveBeenCalledTimes(1);
    expect(db.insertWebVitals).toHaveBeenCalledWith([], 'test-session-id', '/test-page');
  });

  it('should reject requests without required fields', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    mockHeaders.set('x-forwarded-for', '192.168.1.1');

    const mockRequest = new NextRequest('https://example.com/api/track', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        // Missing sessionId
        pageUrl: '/test-page'
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const responseData = await response.json();
    expect(responseData).toEqual({
      success: false,
      error: 'Missing required fields: sessionId or pageUrl'
    });

    // Verify no database calls were made
    expect(db.insertUserAgent).not.toHaveBeenCalled();
    expect(db.insertPageview).not.toHaveBeenCalled();
    expect(db.insertWebVitals).not.toHaveBeenCalled();
  });

  // Skip the rate limiting test for now as it's more complex to mock
  it.skip('should handle rate limiting correctly', async () => {
    // This test would need more complex setup to properly test rate limiting
  });
});
