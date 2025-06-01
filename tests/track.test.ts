import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/track/route';
import * as db from '@/lib/db';

// Mock the database module
vi.mock('@/lib/db', () => ({
  insertUserAgent: vi.fn().mockReturnValue(1),
  insertPageview: vi.fn().mockReturnValue(1),
  insertWebVitals: vi.fn(),
  hashIp: vi.fn().mockReturnValue('hashed-ip')
}));

describe('Track API Route', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock request
    mockRequest = new NextRequest('https://example.com/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1'
      }
    });
  });

  it('should handle valid pageview data', async () => {
    // Mock request JSON
    const mockJson = vi.fn().mockResolvedValue({
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      referrer: 'https://google.com'
    });

    mockRequest.json = mockJson;

    // Call the API route
    const response = await POST(mockRequest);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });

    // Verify database calls
    expect(db.insertUserAgent).toHaveBeenCalledTimes(1);
    expect(db.insertPageview).toHaveBeenCalledTimes(1);
    expect(db.insertWebVitals).not.toHaveBeenCalled();
  });

  it('should handle web vitals data', async () => {
    // Mock request JSON with web vitals
    const mockJson = vi.fn().mockResolvedValue({
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      webVitals: [
        { name: 'LCP', value: 2500, rating: 'good' },
        { name: 'CLS', value: 0.05, rating: 'good' }
      ]
    });

    mockRequest.json = mockJson;

    // Call the API route
    const response = await POST(mockRequest);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });

    // Verify database calls
    expect(db.insertUserAgent).toHaveBeenCalledTimes(1);
    expect(db.insertPageview).toHaveBeenCalledTimes(1);
    expect(db.insertWebVitals).toHaveBeenCalledTimes(1);
    expect(db.insertWebVitals).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'LCP', value: 2500 }),
        expect.objectContaining({ name: 'CLS', value: 0.05 })
      ]),
      'test-session-id',
      '/test-page'
    );
  });

  it('should reject invalid web vitals data', async () => {
    // Mock request JSON with invalid web vitals
    const mockJson = vi.fn().mockResolvedValue({
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      webVitals: [
        { name: 'INVALID_METRIC', value: 2500 },
        { name: 'LCP', value: 'not-a-number' }
      ]
    });

    mockRequest.json = mockJson;

    // Call the API route
    const response = await POST(mockRequest);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });

    // Verify database calls - should not insert invalid web vitals
    expect(db.insertUserAgent).toHaveBeenCalledTimes(1);
    expect(db.insertPageview).toHaveBeenCalledTimes(1);
    expect(db.insertWebVitals).toHaveBeenCalledWith([], 'test-session-id', '/test-page');
  });

  it('should reject requests with missing required fields', async () => {
    // Mock request JSON with missing fields
    const mockJson = vi.fn().mockResolvedValue({
      // Missing pageUrl
      timestamp: Date.now(),
      sessionId: 'test-session-id',
      userAgent: 'Mozilla/5.0'
    });

    mockRequest.json = mockJson;

    // Call the API route
    const response = await POST(mockRequest);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Missing required fields' });

    // Verify no database calls were made
    expect(db.insertUserAgent).not.toHaveBeenCalled();
    expect(db.insertPageview).not.toHaveBeenCalled();
    expect(db.insertWebVitals).not.toHaveBeenCalled();
  });

  it('should handle rate limiting', async () => {
    // Mock request JSON
    const mockJson = vi.fn().mockResolvedValue({
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id',
      userAgent: 'Mozilla/5.0'
    });

    mockRequest.json = mockJson;

    // Make multiple requests to trigger rate limiting
    const responses = [];
    for (let i = 0; i < 101; i++) {
      responses.push(await POST(mockRequest));
    }

    // First 100 should succeed, 101st should be rate limited
    for (let i = 0; i < 100; i++) {
      expect(responses[i].status).toBe(200);
    }

    const lastResponse = responses[100];
    const lastData = await lastResponse.json();

    expect(lastResponse.status).toBe(429);
    expect(lastData).toEqual({ error: 'Rate limit exceeded' });
  });
});
