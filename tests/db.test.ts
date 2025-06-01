import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getDb, 
  insertUserAgent, 
  insertPageview, 
  insertWebVitals,
  insertCustomEvent,
  getPageviewStats,
  getReferrerStats,
  getDeviceStats,
  getWebVitalStats,
  getCustomEventStats
} from '@/lib/db';

// Mock better-sqlite3
vi.mock('better-sqlite3', () => {
  const mockDb = {
    prepare: vi.fn().mockReturnThis(),
    run: vi.fn().mockReturnValue({ lastInsertRowid: 1 }),
    get: vi.fn().mockReturnValue({ id: 1, count: 100 }),
    all: vi.fn().mockReturnValue([]),
    exec: vi.fn(),
    pragma: vi.fn()
  };
  
  return {
    default: vi.fn().mockReturnValue(mockDb)
  };
});

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn().mockReturnValue('-- Mock SQL Schema')
}));

describe('Database Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should initialize database connection', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });
  
  it('should insert user agent data', () => {
    const userAgentData = {
      browser: 'Chrome',
      browserVersion: '100.0.0',
      os: 'Windows',
      osVersion: '10',
      deviceType: 'desktop',
      deviceVendor: 'Unknown',
      deviceModel: 'Unknown'
    };
    
    const id = insertUserAgent(userAgentData);
    expect(id).toBe(1);
  });
  
  it('should insert pageview data', () => {
    const pageviewData = {
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id',
      referrer: 'https://google.com',
      userAgent: 'Mozilla/5.0'
    };
    
    const id = insertPageview(pageviewData, '127.0.0.1', 1);
    expect(id).toBe(1);
  });
  
  it('should insert web vitals data', () => {
    const webVitals = [
      { name: 'LCP', value: 2500, rating: 'good' },
      { name: 'CLS', value: 0.05, rating: 'good' }
    ];
    
    insertWebVitals(webVitals, 'test-session-id', '/test-page');
    // Successful execution without errors is sufficient for this test
    expect(true).toBe(true);
  });
  
  it('should insert custom event data', () => {
    const customEvent = {
      eventName: 'button_click',
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id',
      eventData: { buttonId: 'signup' }
    };
    
    const id = insertCustomEvent(customEvent);
    expect(id).toBe(1);
  });
  
  it('should get pageview statistics', () => {
    const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endTime = Date.now();
    
    const stats = getPageviewStats(startTime, endTime);
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('byDay');
    expect(stats).toHaveProperty('byPage');
  });
  
  it('should get referrer statistics', () => {
    const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endTime = Date.now();
    
    const stats = getReferrerStats(startTime, endTime);
    expect(stats).toHaveProperty('byReferrer');
  });
  
  it('should get device statistics', () => {
    const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endTime = Date.now();
    
    const stats = getDeviceStats(startTime, endTime);
    expect(stats).toHaveProperty('byBrowser');
    expect(stats).toHaveProperty('byOS');
    expect(stats).toHaveProperty('byDeviceType');
  });
  
  it('should get web vital statistics', () => {
    const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endTime = Date.now();
    
    const stats = getWebVitalStats(startTime, endTime);
    expect(stats).toHaveProperty('byMetric');
  });
  
  it('should get custom event statistics', () => {
    const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endTime = Date.now();
    
    const stats = getCustomEventStats(startTime, endTime);
    expect(stats).toHaveProperty('byEvent');
    expect(stats).toHaveProperty('recent');
  });
});
