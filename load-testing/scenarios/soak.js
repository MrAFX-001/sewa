/**
 * Soak Test Scenario (Endurance / Reliability)
 *
 * Purpose:
 *   Evaluate system stability, memory consumption, DB connection pool leaks,
 *   and gradual performance degradation over an extended period.
 *
 * Parameters:
 *   - SOAK_DURATION: Default '30m' (conservative default; do NOT run multi-hour tests unmonitored)
 *   - SOAK_VUS: Default 30 VUs
 */

import { config } from '../lib/config.js';
import { initSession, executeWeightedJourney, createSummaryOutput, randomThinkTime } from '../lib/helpers.js';

const soakVus = config.soak.vus;
const soakDuration = config.soak.duration;

export const options = {
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '2m', target: soakVus },       // Gentle ramp-up
    { duration: soakDuration, target: soakVus }, // Long steady state to detect memory/connection leaks
    { duration: '2m', target: 0 },             // Gradual drain
  ],
  thresholds: {
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
  randomThinkTime(1.5, 3.5);
}

export function handleSummary(data) {
  return createSummaryOutput(data, 'soak');
}




