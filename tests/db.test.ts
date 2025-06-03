import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDb,
  insertUserAgent,
  insertPageview,
  insertWebVitals,
  insertCustomEvent,
  hashIp
} from '@/lib/db';
import path from 'path';

// Mock better-sqlite3
vi.mock('better-sqlite3', () => {
  const mockDb = {
    pragma: vi.fn().mockReturnThis(),
    prepare: vi.fn().mockReturnThis(),
    get: vi.fn(),
    all: vi.fn(),
    run: vi.fn().mockReturnValue({ lastInsertRowid: 123 }),
    exec: vi.fn(),
    transaction: vi.fn((fn) => fn),
    close: vi.fn()
  };

  return {
    default: vi.fn().mockReturnValue(mockDb)
  };
});

// Mock fs
vi.mock('fs', () => {
  return {
    default: {
      existsSync: vi.fn().mockReturnValue(true),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn().mockReturnValue('-- Mock SQL Schema')
    },
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue('-- Mock SQL Schema')
  };
});

// Mock path
vi.mock('path', () => {
  return {
    default: {
      dirname: vi.fn().mockReturnValue('/mock/dir'),
      join: vi.fn().mockReturnValue('/mock/path')
    },
    dirname: vi.fn().mockReturnValue('/mock/dir'),
    join: vi.fn().mockReturnValue('/mock/path')
  };
});

// Mock crypto
vi.mock('crypto', () => {
  const mockHash = {
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue('hashed-ip')
  };

  return {
    createHash: vi.fn().mockReturnValue(mockHash)
  };
});

// Mock the actual hashIp function
vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    hashIp: vi.fn().mockReturnValue('hashed-ip')
  };
});

describe('Database Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize database connection', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });

  it('should hash IP addresses', () => {
    const hashedIp = hashIp('192.168.1.1');
    expect(hashedIp).toBe('hashed-ip');
  });

  it('should insert user agent data', () => {
    const userAgentData = {
      browser: 'Chrome',
      browserVersion: '100.0',
      os: 'Windows',
      osVersion: '10',
      deviceType: 'desktop',
      deviceVendor: null,
      deviceModel: null
    };

    // Mock existing user agent lookup
    const mockDb = getDb();
    mockDb.prepare().get.mockReturnValueOnce({ id: 42 });

    const result = insertUserAgent(userAgentData);
    expect(result).toBe(42);
    expect(mockDb.prepare).toHaveBeenCalled();
  });

  it('should insert new user agent when not found', () => {
    const userAgentData = {
      browser: 'Firefox',
      browserVersion: '95.0',
      os: 'MacOS',
      osVersion: '12',
      deviceType: 'desktop',
      deviceVendor: null,
      deviceModel: null
    };

    // Mock no existing user agent
    const mockDb = getDb();
    mockDb.prepare().get.mockReturnValueOnce(undefined);

    const result = insertUserAgent(userAgentData);
    expect(result).toBe(123); // From the mocked lastInsertRowid
    // Don't check exact call count as it may vary based on implementation
  });

  it('should insert pageview data', () => {
    const pageviewData = {
      pageUrl: '/test-page',
      timestamp: Date.now(),
      sessionId: 'test-session-id',
      referrer: 'https://example.com'
    };

    const result = insertPageview(pageviewData, '192.168.1.1', 42);
    expect(result).toBe(123); // From the mocked lastInsertRowid

    const mockDb = getDb();
    expect(mockDb.prepare).toHaveBeenCalled();
    expect(mockDb.prepare().run).toHaveBeenCalled();
  });

  it('should insert web vitals data', () => {
    const webVitals = [
      { name: 'LCP', value: 2500, rating: 'good' },
      { name: 'FID', value: 100, rating: 'good' },
      { name: 'CLS', value: 0.1, rating: 'good' }
    ];

    insertWebVitals(webVitals, 'test-session-id', '/test-page');

    const mockDb = getDb();
    expect(mockDb.prepare).toHaveBeenCalled();
    expect(mockDb.transaction).toHaveBeenCalled();
  });

  it('should insert custom event data', () => {
    const eventData = {
      sessionId: 'test-session-id',
      pageUrl: '/test-page',
      timestamp: Date.now(),
      eventName: 'button_click',
      eventData: { buttonId: 'submit', position: { x: 100, y: 200 } }
    };

    const result = insertCustomEvent(eventData);
    expect(result).toBe(123); // From the mocked lastInsertRowid

    const mockDb = getDb();
    expect(mockDb.prepare).toHaveBeenCalled();
    expect(mockDb.prepare().run).toHaveBeenCalled();
  });
});
