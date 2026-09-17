/**
 * Smoke Test Scenario
 *
 * Purpose:
 *   Verify that the SEWA 2026 frontend pages and backend APIs function correctly
 *   under minimal load (1-2 VUs).
 *
 * Target:
 *   1-2 VUs for ~1 minute.
 *
 * Validations:
 *   - HTTP status codes (200 OK)
 *   - Response time within SLA
 *   - Response payloads and schema structure
 *   - Zero unexpected 5xx responses
 */

import { config } from '../lib/config.js';
import { initSession, executeWeightedJourney, createSummaryOutput, randomThinkTime } from '../lib/helpers.js';

export const options = {
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  vus: config.smoke.vus,
  duration: config.smoke.duration,
  thresholds: {
    // 0% tolerance for 5xx server errors during smoke test
    'sewa_5xx_rate': ['rate==0'],
    // 99% of requests must succeed
    'http_req_failed': ['rate<0.01'],
    // Latency checks
    'http_req_duration': ['p(95)<1500', 'p(99)<3000'],
  },
};

export function setup() {
  return initSession();
}

export default function (session) {
  executeWeightedJourney(session);
  randomThinkTime(1.0, 2.0);
}

export function handleSummary(data) {
  return createSummaryOutput(data, 'smoke');
}




