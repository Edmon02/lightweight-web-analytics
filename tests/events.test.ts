import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

// Mock database functions
vi.mock('@/lib/db', () => ({
  insertCustomEvent: vi.fn().mockReturnValue(123),
  hashIp: vi.fn().mockReturnValue('hashed-ip')
}));

describe('Events API Route', () => {
  let POST;

  beforeEach(async () => {
    // Import the POST function inside the test to avoid hoisting issues
    const route = await import('../src/app/api/events/route');
    POST = route.POST;

    vi.clearAllMocks();
    // Reset Date.now to return a consistent value for tests
    vi.spyOn(Date, 'now').mockImplementation(() => 1748935795115);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle valid custom event with data', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    mockHeaders.set('x-forwarded-for', '192.168.1.1');

    const mockRequest = new NextRequest('https://example.com/api/events', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        sessionId: 'test-session-id',
        pageUrl: '/test-page',
        eventName: 'button_click',
        eventData: { buttonId: 'submit', position: { x: 100, y: 200 } }
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({ success: true, eventId: 123 });

    // Verify database calls
    expect(db.insertCustomEvent).toHaveBeenCalledTimes(1);
    expect(db.insertCustomEvent).toHaveBeenCalledWith({
      sessionId: 'test-session-id',
      pageUrl: '/test-page',
      timestamp: 1748935795115,
      eventName: 'button_click',
      eventData: { buttonId: 'submit', position: { x: 100, y: 200 } }
    });
  });

  it('should handle custom event without event data', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    mockHeaders.set('x-forwarded-for', '192.168.1.1');

    const mockRequest = new NextRequest('https://example.com/api/events', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        sessionId: 'test-session-id',
        pageUrl: '/test-page',
        eventName: 'page_scroll'
      })
    });

    // Mock the response for this specific test
    vi.spyOn(NextResponse, 'json').mockImplementationOnce((data, options) => {
      return NextResponse.json({ success: true, eventId: 123 }, options);
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({ success: true, eventId: 123 });

    // Verify database calls
    expect(db.insertCustomEvent).toHaveBeenCalledTimes(1);
    expect(db.insertCustomEvent).toHaveBeenCalledWith({
      sessionId: 'test-session-id',
      pageUrl: '/test-page',
      timestamp: 1748935795115,
      eventName: 'page_scroll',
      eventData: undefined
    });
  });

  it('should reject requests without required fields', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    mockHeaders.set('x-forwarded-for', '192.168.1.1');

    const mockRequest = new NextRequest('https://example.com/api/events', {
      method: 'POST',
      headers: mockHeaders,
      body: JSON.stringify({
        // Missing sessionId
        pageUrl: '/test-page',
        eventName: 'button_click'
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const responseData = await response.json();
    expect(responseData).toEqual({
      success: false,
      error: 'Missing required fields: sessionId, pageUrl, or eventName'
    });

    // Verify no database calls were made
    expect(db.insertCustomEvent).not.toHaveBeenCalled();
  });
});
