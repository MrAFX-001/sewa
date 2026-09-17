/**
 * Load Test Scenario
 *
 * Purpose:
 *   Measure application behavior and response times under expected peak traffic.
 *   Uses a stepped, gradual progression rather than an abrupt traffic spike.
 *
 * Progression:
 *   10 VUs -> 50 VUs -> 100 VUs -> 250 VUs -> 500 VUs -> Ramp-down
 *   (Max VUs configurable via LOAD_MAX_VUS, default 500)
 */

import { config } from '../lib/config.js';
import { initSession, executeWeightedJourney, createSummaryOutput, randomThinkTime } from '../lib/helpers.js';

const maxVus = config.load.targetMaxVus;
const v1 = Math.max(5, Math.round(maxVus * 0.02));   // ~10 VUs
const v2 = Math.max(15, Math.round(maxVus * 0.10));  // ~50 VUs
const v3 = Math.max(30, Math.round(maxVus * 0.20));  // ~100 VUs
const v4 = Math.max(60, Math.round(maxVus * 0.50));  // ~250 VUs
const v5 = maxVus;                                   // ~500 VUs

export const options = {
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '1m', target: v1 },  // Warm-up to 10 VUs
    { duration: '2m', target: v1 },  // Steady at initial stage
    { duration: '1m', target: v2 },  // Ramp to 50 VUs
    { duration: '2m', target: v2 },  // Steady at 50 VUs
    { duration: '1m', target: v3 },  // Ramp to 100 VUs
    { duration: '3m', target: v3 },  // Steady at 100 VUs
    { duration: '2m', target: v4 },  // Ramp to 250 VUs
    { duration: '3m', target: v4 },  // Steady at 250 VUs
    { duration: '2m', target: v5 },  // Ramp to Max VUs (500)
    { duration: '3m', target: v5 },  // Hold at peak capacity
    { duration: '2m', target: 0 },   // Graceful cool-down
  ],
  thresholds: {
    // Under peak load, failure rate must remain below 2%
    'http_req_failed': ['rate<0.02'],
    'sewa_5xx_rate': ['rate<0.01'],
    'http_req_duration': ['p(95)<1500', 'p(99)<3000'],
  },
};

export function setup() {
  return initSession();
}

export default function (session) {
  executeWeightedJourney(session);
  randomThinkTime(1.0, 3.0);
}

export function handleSummary(data) {
  return createSummaryOutput(data, 'load');
}

