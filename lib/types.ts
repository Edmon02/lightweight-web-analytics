/**
 * Types for analytics data
 */

// Core web vitals types
export type WebVitalName = 'LCP' | 'FCP' | 'CLS' | 'FID' | 'TTFB';

export type WebVitalRating = 'good' | 'needs-improvement' | 'poor';

export interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  rating?: WebVitalRating;
}

// User agent types
export interface UserAgentData {
  id?: number;
  browser: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  deviceType?: string;
  deviceVendor?: string;
  deviceModel?: string;
}

// Pageview types
export interface PageviewData {
  pageUrl: string;
  timestamp: number;
  sessionId: string;
  referrer?: string;
  userAgent: string;
}

// Custom event types
export interface CustomEventData {
  eventName: string;
  pageUrl: string;
  timestamp: number;
  sessionId: string;
  eventData?: Record<string, unknown>;
}

// Beacon payload types
export interface BeaconPayload {
  pageUrl: string;
  timestamp: number;
  sessionId: string;
  referrer?: string;
  userAgent: string;
  webVitals?: WebVitalMetric[];
}

// Dashboard data types
export interface PageviewStats {
  total: number;
  byDay: Array<{ date: string; count: number }>;
  byPage: Array<{ page: string; count: number }>;
}

export interface ReferrerStats {
  byReferrer: Array<{ referrer: string; count: number }>;
}

export interface DeviceStats {
  byBrowser: Array<{ browser: string; count: number }>;
  byOS: Array<{ os: string; count: number }>;
  byDeviceType: Array<{ deviceType: string; count: number }>;
}

export interface WebVitalStats {
  byMetric: Array<{
    name: WebVitalName;
    average: number;
    median: number;
    p75: number;
    p95: number;
    rating: WebVitalRating;
  }>;
}

export interface CustomEventStats {
  byEvent: Array<{ eventName: string; count: number }>;
  recent: Array<{
    eventName: string;
    timestamp: number;
    pageUrl: string;
    eventData?: Record<string, unknown>;
  }>;
}

export interface DashboardData {
  pageviews: PageviewStats;
  referrers: ReferrerStats;
  devices: DeviceStats;
  webVitals: WebVitalStats;
  customEvents: CustomEventStats;
  timeRange: {
    start: number;
    end: number;
  };
}
