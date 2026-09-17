/**
 * Arrival Rate 10K Test Scenario (10,000 Real-World Concurrent Visitors)
 *
 * Purpose:
 *   Emulate 10,000 simultaneous active website visitors using k6's open-model
 *   ramping-arrival-rate executor.
 *
 * Concept:
 *   In real-world web traffic, 10,000 simultaneous visitors browsing a portal with
 *   an average of 5-second think time generate ~2,000 iteration starts per second.
 *
 * Sizing & Efficiency:
 *   Instead of keeping 10,000 idle threads in memory, this dynamically utilizes a pool
 *   of 500 - 2,500 active VUs to deliver the exact traffic throughput of 10,000 users.
 *   Consumes under 3 GB of RAM on the generator laptop, avoiding OOM risks while exerting
 *   full production scale pressure on the server.
 */

import { initSession, executeWeightedJourney, createSummaryOutput, randomThinkTime } from '../lib/helpers.js';

const peakRate = parseInt(__ENV.SCALE_RATE || '2000', 10);
const r1 = Math.max(50, Math.round(peakRate * 0.125));  // 250/s
const r2 = Math.max(100, Math.round(peakRate * 0.25));  // 500/s
const r3 = Math.max(250, Math.round(peakRate * 0.50));  // 1,000/s
const r4 = peakRate;                                   // 2,000/s (~10k concurrent visitors)

export const options = {
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    visitors_10k: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      maxVUs: 3000,
      stages: [
        { duration: '2m', target: r1 },  // Warm-up to ~1,250 concurrent visitors
        { duration: '2m', target: r1 },  // Steady
        { duration: '2m', target: r2 },  // Ramp to ~2,500 concurrent visitors
        { duration: '2m', target: r2 },  // Steady
        { duration: '2m', target: r3 },  // Ramp to ~5,000 concurrent visitors
        { duration: '3m', target: r3 },  // Steady
        { duration: '2m', target: r4 },  // Peak ramp to 10,000 concurrent visitor volume
        { duration: '3m', target: r4 },  // Hold at peak 10k visitor load
        { duration: '2m', target: 0 },   // Graceful drain
      ],
    },
  },
  thresholds: {
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
  randomThinkTime(1.0, 3.0);
}

export function handleSummary(data) {
  return createSummaryOutput(data, 'arrival-10k');
}
