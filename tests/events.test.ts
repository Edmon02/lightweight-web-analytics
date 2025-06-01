import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/events/route';
import * as db from '@/lib/db';

// Mock the database module
vi.mock('@/lib/db', () => ({
  insertCustomEvent: vi.fn().mockReturnValue(1)
}));

describe('Events API Route', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('https://example.com/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1'
      }
    });
  });
  
  it('should handle valid custom event data', async () => {
    // Mock request JSON
    const mockJson = vi.fn().mockResolvedValue({
      eventName: 'button_click',
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id',
      eventData: { buttonId: 'signup', section: 'hero' }
    });
    
    mockRequest.json = mockJson;
    
    // Call the API route
    const response = await POST(mockRequest);
    const data = await response.json();
    
    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    
    // Verify database calls
    expect(db.insertCustomEvent).toHaveBeenCalledTimes(1);
    expect(db.insertCustomEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'button_click',
        eventData: { buttonId: 'signup', section: 'hero' }
      })
    );
  });
  
  it('should handle custom event without event data', async () => {
    // Mock request JSON without event data
    const mockJson = vi.fn().mockResolvedValue({
      eventName: 'page_scroll',
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id'
    });
    
    mockRequest.json = mockJson;
    
    // Call the API route
    const response = await POST(mockRequest);
    const data = await response.json();
    
    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    
    // Verify database calls
    expect(db.insertCustomEvent).toHaveBeenCalledTimes(1);
    expect(db.insertCustomEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'page_scroll',
        eventData: undefined
      })
    );
  });
  
  it('should reject invalid event data format', async () => {
    // Mock request JSON with invalid event data (string instead of object)
    const mockJson = vi.fn().mockResolvedValue({
      eventName: 'button_click',
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id',
      eventData: 'not-an-object'
    });
    
    mockRequest.json = mockJson;
    
    // Call the API route
    const response = await POST(mockRequest);
    const data = await response.json();
    
    // Verify response
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Event data must be an object' });
    
    // Verify no database calls were made
    expect(db.insertCustomEvent).not.toHaveBeenCalled();
  });
  
  it('should reject requests with missing required fields', async () => {
    // Mock request JSON with missing fields
    const mockJson = vi.fn().mockResolvedValue({
      // Missing eventName
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id'
    });
    
    mockRequest.json = mockJson;
    
    // Call the API route
    const response = await POST(mockRequest);
    const data = await response.json();
    
    // Verify response
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Missing required fields' });
    
    // Verify no database calls were made
    expect(db.insertCustomEvent).not.toHaveBeenCalled();
  });
});
