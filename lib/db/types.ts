import { 
  WebVitalName,
  WebVitalRating,
  PageviewStats,
  ReferrerStats,
  DeviceStats,
  WebVitalStats,
  CustomEventStats
} from '../types';

// Database configuration
export interface DbConfig {
  path: string;
  hashSalt: string;
}

// Query result types
export interface PageviewQueryResult {
  count: number;
  date?: string;
  page_url?: string;
}

export interface ReferrerQueryResult {
  referrer: string;
  count: number;
}

export interface DeviceQueryResult {
  browser?: string;
  os?: string;
  device_type?: string;
  count: number;
}

export interface WebVitalQueryResult {
  metric_name: WebVitalName;
  metric_value: number;
  metric_rating?: WebVitalRating;
  average: number;
}

export interface CustomEventQueryResult {
  event_name: string;
  count: number;
  timestamp?: number;
  page_url?: string;
  event_data?: string;
}

// Web Vitals thresholds
interface MetricThreshold {
  good: number;
  needsImprovement: number;
}

export const METRIC_THRESHOLDS: Record<WebVitalName, MetricThreshold> = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 }
};
