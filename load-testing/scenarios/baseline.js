/**
 * Baseline Test Scenario
 *
 * Purpose:
 *   Establish a performance baseline with steady low traffic.
 *   Captures reference measurements for latency percentiles (p50, p90, p95, p99)
 *   and system throughput under normal operational conditions.
 *
 * Target:
 *   10 VUs for 5 minutes (configurable via BASELINE_VUS and BASELINE_DURATION).
 */

import { config } from '../lib/config.js';
import { initSession, executeWeightedJourney, createSummaryOutput, randomThinkTime } from '../lib/helpers.js';

export const options = {
  vus: config.baseline.vus,
  duration: config.baseline.duration,
  thresholds: {
    // Example baseline SLAs - adjust according to production targets
    'http_req_failed': ['rate<0.01'],
    'sewa_5xx_rate': ['rate<0.005'],
    'http_req_duration': [
      'avg<500',
      'p(50)<300',
      'p(90)<800',
      'p(95)<1000',
      'p(99)<2000',
    ],
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
  return createSummaryOutput(data, 'baseline');
}

