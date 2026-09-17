/**
 * Spike Test Scenario
 *
 * Purpose:
 *   Simulate a sudden, sharp influx of concurrent users (e.g., challenge launch announcement)
 *   and evaluate how rapidly the system recovers to baseline latency.
 *
 * Progression:
 *   10 VUs (baseline) -> Sharp surge to Peak VUs (default 500, configurable) -> Fast recovery
 */

import { config } from '../lib/config.js';
import { initSession, executeWeightedJourney, createSummaryOutput, randomThinkTime } from '../lib/helpers.js';

const peakVus = config.spike.peakVus;
const baseVus = 10;

export const options = {
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '1m', target: baseVus }, // Pre-spike baseline
    { duration: '30s', target: peakVus }, // Abrupt traffic spike
    { duration: '1m', target: peakVus },  // Sustain peak pressure
    { duration: '30s', target: baseVus }, // Rapid ramp-down to baseline
    { duration: '2m', target: baseVus },  // Recovery observation window
    { duration: '30s', target: 0 },       // Complete cool-down
  ],
  thresholds: {
    // Spike allows brief queueing, but requests should still succeed
    'http_req_failed': ['rate<0.05'],
    'sewa_5xx_rate': ['rate<0.03'],
    'http_req_duration': ['p(95)<3000', 'p(99)<5000'],
  },
};

export function setup() {
  return initSession();
}

export default function (session) {
  executeWeightedJourney(session);
  randomThinkTime(0.5, 2.0); // Faster pacing during spike event
}

export function handleSummary(data) {
  return createSummaryOutput(data, 'spike');
}
