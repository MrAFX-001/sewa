/**
 * Custom performance metrics for the SEWA 2026 k6 load-testing suite.
 *
 * Captures granular operation latencies and business-level success/error rates.
 */

import { Trend, Counter, Rate } from 'k6/metrics';

// Latency Trends by Operation Type
export const pageDuration = new Trend('sewa_page_duration_ms', true);
export const apiHealthDuration = new Trend('sewa_api_health_duration_ms', true);
export const apiAnnouncementsDuration = new Trend('sewa_api_announcements_duration_ms', true);
export const apiAuthDuration = new Trend('sewa_api_auth_duration_ms', true);
export const staticAssetDuration = new Trend('sewa_static_duration_ms', true);

// Failure & Anomaly Rates
export const serverError5xxRate = new Rate('sewa_5xx_rate');
export const rateLimited429Rate = new Rate('sewa_429_rate');

// Business & Operational Counters
export const successfulJourneys = new Counter('sewa_successful_journeys');
export const failedJourneys = new Counter('sewa_failed_journeys');
