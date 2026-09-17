/**
 * Stress Test Scenario
 *
 * Purpose:
 *   Determine system breaking points, concurrency ceilings, and degradation characteristics.
 *   Uses a stepped progression up to MAX_VUS (default conservative: 500, configurable up to 2000+).
 *
 * Safety & Circuit Breaking:
 *   Includes strict abortOnFail thresholds: if the failure rate exceeds 10% or p95 latency exceeds 4000ms
 *   or 5xx responses exceed 5%, k6 immediately aborts execution to protect the live server.
 */

import { config } from '../lib/config.js';
import { initSession, executeWeightedJourney, createSummaryOutput, randomThinkTime } from '../lib/helpers.js';

const maxVus = config.stress.maxVus;

// Calculate progressive stress levels up to maxVus
const s1 = Math.max(10, Math.round(maxVus * 0.10));   // Stage 1 (e.g., 100 if max=1000)
const s2 = Math.max(25, Math.round(maxVus * 0.25));   // Stage 2 (e.g., 250)
const s3 = Math.max(50, Math.round(maxVus * 0.50));   // Stage 3 (e.g., 500)
const s4 = Math.max(75, Math.round(maxVus * 0.75));   // Stage 4 (e.g., 750)
const s5 = maxVus;                                   // Peak Stage (e.g., 1000 or MAX_VUS)

export const options = {
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '1m', target: s1 },
    { duration: '2m', target: s1 },
    { duration: '1m', target: s2 },
    { duration: '2m', target: s2 },
    { duration: '1m', target: s3 },
    { duration: '2m', target: s3 },
    { duration: '2m', target: s4 },
    { duration: '2m', target: s4 },
    { duration: '2m', target: s5 },
    { duration: '3m', target: s5 },
    { duration: '2m', target: 0 },  // Cool-down
  ],
  thresholds: {
    // Stopping Condition 1: Abort if total error rate exceeds 10%
    'http_req_failed': [
      { threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '30s' },
    ],
    // Stopping Condition 2: Abort if 5xx server errors exceed 5%
    'sewa_5xx_rate': [
      { threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '30s' },
    ],
    // Stopping Condition 3: Abort if p95 response time breaches 4000ms
    'http_req_duration': [
      { threshold: 'p(95)<4000', abortOnFail: true, delayAbortEval: '30s' },
      'p(99)<6000',
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
  return createSummaryOutput(data, 'stress');
}
