/**
 * Scale 10K Test Scenario (10,000 Virtual Users)
 *
 * Purpose:
 *   High-capacity stress and ceiling evaluation targeting 10,000 concurrent Virtual Users (VUs).
 *
 * Memory Optimization:
 *   - discardResponseBodies: true is mandatory to avoid allocating gigabytes of HTML/JSON payloads
 *     in client RAM across 10,000 concurrent VUs.
 *
 * Safety & Circuit Breaking:
 *   - Automatic abort (abortOnFail: true) if error rate breaches 10%, 5xx errors breach 5%,
 *     or p95 latency breaches 5000ms, preventing server-side kernel or database lockups.
 *
 * Progression:
 *   1,000 VUs -> 2,500 VUs -> 5,000 VUs -> 7,500 VUs -> 10,000 VUs -> Cool-down
 */

import { config } from '../lib/config.js';
import { initSession, executeWeightedJourney, createSummaryOutput, randomThinkTime } from '../lib/helpers.js';

const peakVus = parseInt(__ENV.MAX_VUS || '10000', 10);
const s1 = Math.max(100, Math.round(peakVus * 0.10));   // 1,000 VUs
const s2 = Math.max(250, Math.round(peakVus * 0.25));   // 2,500 VUs
const s3 = Math.max(500, Math.round(peakVus * 0.50));   // 5,000 VUs
const s4 = Math.max(750, Math.round(peakVus * 0.75));   // 7,500 VUs
const s5 = peakVus;                                    // 10,000 VUs

export const options = {
  insecureSkipTLSVerify: true,
  // Critical: drop response bodies after checks to conserve client RAM with 10k VUs
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '2m', target: s1 },  // Warm-up to 1,000 VUs
    { duration: '2m', target: s1 },  // Steady
    { duration: '2m', target: s2 },  // Ramp to 2,500 VUs
    { duration: '3m', target: s2 },  // Steady
    { duration: '2m', target: s3 },  // Ramp to 5,000 VUs
    { duration: '3m', target: s3 },  // Steady
    { duration: '2m', target: s4 },  // Ramp to 7,500 VUs
    { duration: '3m', target: s4 },  // Steady
    { duration: '3m', target: s5 },  // Peak ramp to 10,000 VUs
    { duration: '3m', target: s5 },  // Hold at 10,000 VUs
    { duration: '3m', target: 0 },   // Graceful cool-down
  ],
  thresholds: {
    // Safety Circuit Breakers: Stop if application fails under excessive load
    'http_req_failed': [
      { threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '30s' },
    ],
    'sewa_5xx_rate': [
      { threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '30s' },
    ],
    'http_req_duration': [
      { threshold: 'p(95)<5000', abortOnFail: true, delayAbortEval: '30s' },
      'p(99)<8000',
    ],
  },
};

export function setup() {
  return initSession();
}

export default function (session) {
  executeWeightedJourney(session);
  // Realistic think time between steps to prevent socket thrashing
  randomThinkTime(1.5, 4.0);
}

export function handleSummary(data) {
  return createSummaryOutput(data, 'scale-10k');
}
