/**
 * Global configuration parser and defaults for the k6 test suite.
 *
 * All parameters can be overridden at runtime via k6 -e or standard environment variables.
 */

import { getBaseUrl, DEFAULT_HEADERS, JSON_HEADERS, ENDPOINTS } from '../config/environments.js';

export const config = {
  // Target Host
  baseUrl: getBaseUrl(),

  // SSL/TLS Settings: Allow testing internal/private IP deployments with self-signed certs
  insecureSkipTLSVerify: true,

  // Authentication Settings
  // Backend session cookie name is 'sewa_session'
  cookieName: __ENV.COOKIE_NAME || 'sewa_session',
  username: __ENV.K6_USERNAME || '',
  password: __ENV.K6_PASSWORD || '',
  token: __ENV.K6_TOKEN || '',

  // Pacing & Think Time (in seconds)
  thinkTimeMin: parseFloat(__ENV.THINK_TIME_MIN || '1.0'),
  thinkTimeMax: parseFloat(__ENV.THINK_TIME_MAX || '3.0'),

  // Scenario Tuning Parameters
  smoke: {
    vus: parseInt(__ENV.SMOKE_VUS || '2', 10),
    duration: __ENV.SMOKE_DURATION || '1m',
  },

  baseline: {
    vus: parseInt(__ENV.BASELINE_VUS || '10', 10),
    duration: __ENV.BASELINE_DURATION || '5m',
  },

  load: {
    targetMaxVus: parseInt(__ENV.LOAD_MAX_VUS || '500', 10),
  },

  stress: {
    // Conservative default of 500 VUs; user can supply MAX_VUS=2000 if server capacity allows.
    maxVus: parseInt(__ENV.MAX_VUS || '500', 10),
  },

  spike: {
    peakVus: parseInt(__ENV.SPIKE_PEAK_VUS || '500', 10),
  },

  soak: {
    vus: parseInt(__ENV.SOAK_VUS || '30', 10),
    duration: __ENV.SOAK_DURATION || '30m',
  },

  // HTTP Headers
  defaultHeaders: DEFAULT_HEADERS,
  jsonHeaders: JSON_HEADERS,
  endpoints: ENDPOINTS,
};

/**
 * Common standard thresholds used across tests.
 * Note: These serve as example baseline SLAs and should be calibrated
 * based on actual infrastructure capabilities and requirements.
 */
export const defaultThresholds = {
  // Overall request failure rate should stay under 1%
  http_req_failed: ['rate<0.01'],

  // 95% of requests should respond in under 1000ms, 99% in under 2000ms
  http_req_duration: ['p(95)<1000', 'p(99)<2000'],
};




