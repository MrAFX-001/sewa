/**
 * Helper utilities for HTTP calls, user journeys, authentication, and summary reports.
 */

import http from 'k6/http';
import { sleep, group } from 'k6';
import { config } from './config.js';
import {
  checkHtmlPage,
  checkStatus,
  checkHealthResponse,
  checkAnnouncementsResponse,
  checkAuthMeResponse,
  checkProfileResponse,
  checkMyTeamResponse,
} from './checks.js';
import {
  pageDuration,
  apiHealthDuration,
  apiAnnouncementsDuration,
  apiAuthDuration,
  staticAssetDuration,
  successfulJourneys,
  failedJourneys,
} from './metrics.js';

/**
 * Generates a random sleep duration between min and max seconds to emulate human think-time.
 */
export function randomThinkTime(min = config.thinkTimeMin, max = config.thinkTimeMax) {
  const duration = Math.random() * (max - min) + min;
  sleep(duration);
}

/**
 * Initializes a test session during k6's setup() phase.
 *
 * Checks if a token was supplied via K6_TOKEN, or logs in ONCE using K6_USERNAME & K6_PASSWORD
 * to retrieve the 'sewa_session' cookie.
 *
 * NOTE: Login MUST be done in setup() and NEVER in the VU loop, because the backend's
 * signinLimiter restricts login attempts to 10 requests per 15 minutes!
 */
export function initSession() {
  const session = {
    baseUrl: config.baseUrl,
    cookieName: config.cookieName,
    token: config.token,
    isAuthenticated: false,
  };

  // Case 1: Token provided directly
  if (session.token && session.token.trim().length > 0) {
    session.token = session.token.trim();
    session.isAuthenticated = true;
    return session;
  }

  // Case 2: Credentials provided -> perform one login during setup()
  if (config.username && config.password) {
    const loginUrl = `${config.baseUrl}${config.endpoints.authApi.signin}`;
    const payload = JSON.stringify({
      email: config.username,
      password: config.password,
    });

    const res = http.post(loginUrl, payload, {
      headers: config.jsonHeaders,
      timeout: '10s',
    });

    if (res.status === 200) {
      // Extract cookie from response
      const sessionCookie = res.cookies[config.cookieName];
      if (sessionCookie && sessionCookie.length > 0) {
        session.token = sessionCookie[0].value;
        session.isAuthenticated = true;
      }
    }
  }

  return session;
}

/**
 * Builds HTTP request headers, injecting the session cookie when authenticated.
 */
export function buildHeaders(session, isJson = false) {
  const headers = Object.assign({}, isJson ? config.jsonHeaders : config.defaultHeaders);

  if (session && session.token) {
    headers['Cookie'] = `${session.cookieName || 'sewa_session'}=${session.token}`;
  }
  return headers;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Journeys
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Journey 1: Public Portal Exploration (Homepage, Assets, Guidelines, Announcements)
 */
export function journeyPublicVisitor(session) {
  let success = true;

  group('Journey: Public Visitor', () => {
    // 1. Visit Homepage
    const homeRes = http.get(`${config.baseUrl}${config.endpoints.pages.home}`, {
      headers: buildHeaders(session, false),
      tags: { name: 'GET_Home' },
    });
    pageDuration.add(homeRes.timings.duration);
    if (!checkHtmlPage(homeRes, 'Homepage')) success = false;

    // Fetch static branding asset concurrently/consecutively
    const logoRes = http.get(`${config.baseUrl}${config.endpoints.static.logo}`, {
      headers: buildHeaders(session, false),
      tags: { name: 'GET_Logo' },
    });
    staticAssetDuration.add(logoRes.timings.duration);
    if (!checkStatus(logoRes, 200, 'Logo asset')) success = false;

    randomThinkTime(1.0, 2.0);

    // 2. Announcements ticker data
    const annRes = http.get(`${config.baseUrl}${config.endpoints.publicApi.announcements}`, {
      headers: buildHeaders(session, true),
      tags: { name: 'GET_Announcements' },
    });
    apiAnnouncementsDuration.add(annRes.timings.duration);
    if (!checkAnnouncementsResponse(annRes)) success = false;

    randomThinkTime(1.0, 2.5);

    // 3. Problem Statements page
    const psRes = http.get(`${config.baseUrl}${config.endpoints.pages.problemStatements}`, {
      headers: buildHeaders(session, false),
      tags: { name: 'GET_ProblemStatements' },
    });
    pageDuration.add(psRes.timings.duration);
    if (!checkHtmlPage(psRes, 'Problem Statements')) success = false;

    randomThinkTime(1.5, 3.0);

    // 4. Guidelines page
    const guideRes = http.get(`${config.baseUrl}${config.endpoints.pages.guidelines}`, {
      headers: buildHeaders(session, false),
      tags: { name: 'GET_Guidelines' },
    });
    pageDuration.add(guideRes.timings.duration);
    if (!checkHtmlPage(guideRes, 'Guidelines')) success = false;
  });

  if (success) {
    successfulJourneys.add(1);
  } else {
    failedJourneys.add(1);
  }

  return success;
}

/**
 * Journey 2: Content Discovery (About, FAQ, Resources, Events)
 */
export function journeyContentDiscovery(session) {
  let success = true;

  group('Journey: Content Discovery', () => {
    // 1. About page
    const aboutRes = http.get(`${config.baseUrl}${config.endpoints.pages.about}`, {
      headers: buildHeaders(session, false),
      tags: { name: 'GET_About' },
    });
    pageDuration.add(aboutRes.timings.duration);
    if (!checkHtmlPage(aboutRes, 'About')) success = false;

    randomThinkTime(1.0, 2.5);

    // 2. FAQ page
    const faqRes = http.get(`${config.baseUrl}${config.endpoints.pages.faq}`, {
      headers: buildHeaders(session, false),
      tags: { name: 'GET_FAQ' },
    });
    pageDuration.add(faqRes.timings.duration);
    if (!checkHtmlPage(faqRes, 'FAQ')) success = false;

    randomThinkTime(1.0, 2.0);

    // 3. Resources page
    const resRes = http.get(`${config.baseUrl}${config.endpoints.pages.resources}`, {
      headers: buildHeaders(session, false),
      tags: { name: 'GET_Resources' },
    });
    pageDuration.add(resRes.timings.duration);
    if (!checkHtmlPage(resRes, 'Resources')) success = false;
  });

  if (success) {
    successfulJourneys.add(1);
  } else {
    failedJourneys.add(1);
  }

  return success;
}

/**
 * Journey 3: Health & Database Liveness Check
 */
export function journeyHealthCheck(session) {
  let success = true;

  group('Journey: Health Check', () => {
    const healthRes = http.get(`${config.baseUrl}${config.endpoints.publicApi.health}`, {
      headers: buildHeaders(session, true),
      tags: { name: 'GET_Health' },
    });
    apiHealthDuration.add(healthRes.timings.duration);
    if (!checkHealthResponse(healthRes)) success = false;
  });

  if (success) {
    successfulJourneys.add(1);
  } else {
    failedJourneys.add(1);
  }

  return success;
}

/**
 * Journey 4: Authenticated Applicant Flow
 * (Safely falls back to public sign-in page visit if unauthenticated)
 */
export function journeyCandidateDashboard(session) {
  let success = true;

  group('Journey: Candidate Dashboard', () => {
    if (session && session.isAuthenticated) {
      // 1. Current user auth state
      const meRes = http.get(`${config.baseUrl}${config.endpoints.authApi.me}`, {
        headers: buildHeaders(session, true),
        tags: { name: 'GET_Auth_Me' },
      });
      apiAuthDuration.add(meRes.timings.duration);
      if (!checkAuthMeResponse(meRes)) success = false;

      randomThinkTime(1.0, 2.0);

      // 2. Profile KYC read
      const profileRes = http.get(`${config.baseUrl}${config.endpoints.authApi.profile}`, {
        headers: buildHeaders(session, true),
        tags: { name: 'GET_Profile' },
      });
      apiAuthDuration.add(profileRes.timings.duration);
      if (!checkProfileResponse(profileRes)) success = false;

      randomThinkTime(1.0, 2.0);

      // 3. Team registration read
      const teamRes = http.get(`${config.baseUrl}${config.endpoints.authApi.myTeam}`, {
        headers: buildHeaders(session, true),
        tags: { name: 'GET_My_Team' },
      });
      apiAuthDuration.add(teamRes.timings.duration);
      if (!checkMyTeamResponse(teamRes)) success = false;
    } else {
      // Unauthenticated visitor checks the signin portal
      const signinRes = http.get(`${config.baseUrl}${config.endpoints.pages.signin}`, {
        headers: buildHeaders(session, false),
        tags: { name: 'GET_Signin_Page' },
      });
      pageDuration.add(signinRes.timings.duration);
      if (!checkHtmlPage(signinRes, 'Signin Page')) success = false;
    }
  });

  if (success) {
    successfulJourneys.add(1);
  } else {
    failedJourneys.add(1);
  }

  return success;
}

/**
 * Executes a weighted realistic user journey:
 * - 35% Public Portal (Home, Static, Announcements, Problem Statements)
 * - 25% Content Discovery (About, FAQ, Resources)
 * - 25% Health & Database Connectivity (Health API)
 * - 15% Candidate Dashboard / Sign-in Portal
 */
export function executeWeightedJourney(session) {
  const rand = Math.random() * 100;

  if (rand < 35) {
    journeyPublicVisitor(session);
  } else if (rand < 60) {
    journeyContentDiscovery(session);
  } else if (rand < 85) {
    journeyHealthCheck(session);
  } else {
    journeyCandidateDashboard(session);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary Generation (Standalone - No external network downloads required)
// ─────────────────────────────────────────────────────────────────────────────

export function createSummaryOutput(data, scenarioName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Detect output directory dynamically based on execution context
  let resultsDir = 'load-testing/results';
  if (__ENV.RESULTS_DIR) {
    resultsDir = __ENV.RESULTS_DIR.replace(/\/+$/, '');
  } else if (__ENV.PWD && __ENV.PWD.endsWith('load-testing')) {
    resultsDir = 'results';
  }

  const jsonFilename = `${resultsDir}/${scenarioName}_${timestamp}.json`;
  const txtFilename = `${resultsDir}/${scenarioName}_${timestamp}.txt`;

  const metrics = (data && data.metrics) || {};

  const getVal = (name, key, fallback = 0) => {
    if (metrics[name] && metrics[name].values && metrics[name].values[key] !== undefined && metrics[name].values[key] !== null) {
      return metrics[name].values[key];
    }
    return fallback;
  };

  const totalReqs = getVal('http_reqs', 'count', 0);
  const reqRate = Number(getVal('http_reqs', 'rate', 0)).toFixed(2);
  const durationAvg = Number(getVal('http_req_duration', 'avg', 0)).toFixed(2);
  const durationMed = Number(getVal('http_req_duration', 'med', getVal('http_req_duration', 'p(50)', 0))).toFixed(2);
  const durationP90 = Number(getVal('http_req_duration', 'p(90)', 0)).toFixed(2);
  const durationP95 = Number(getVal('http_req_duration', 'p(95)', 0)).toFixed(2);
  const durationP99 = Number(getVal('http_req_duration', 'p(99)', 0)).toFixed(2);
  const failureRate = (Number(getVal('http_req_failed', 'rate', 0)) * 100).toFixed(2);
  const error5xxRate = (Number(getVal('sewa_5xx_rate', 'rate', 0)) * 100).toFixed(2);

  // Extract check totals
  let checksPassed = 0;
  let checksFailed = 0;
  const countChecks = (group) => {
    if (!group) return;
    if (group.checks) {
      for (const c of group.checks) {
        checksPassed += c.passes || 0;
        checksFailed += c.fails || 0;
      }
    }
    if (group.groups) {
      for (const g of group.groups) countChecks(g);
    }
  };
  countChecks(data.root_group);
  const totalChecks = checksPassed + checksFailed;
  const checkPassPct = totalChecks > 0 ? ((checksPassed / totalChecks) * 100).toFixed(2) : '100.00';

  const textReport = `
  SEWA 2026 LOAD TEST SUMMARY: ${scenarioName.toUpperCase()}
  Execution Time     : ${new Date().toISOString()}
  Target Host        : ${config.baseUrl}
  Total Requests     : ${totalReqs} (${reqRate} reqs/sec)
  Request Duration   : avg=${durationAvg}ms | med=${durationMed}ms | p90=${durationP90}ms | p95=${durationP95}ms | p99=${durationP99}ms
  HTTP Failures      : ${failureRate}%
  5xx Server Errors  : ${error5xxRate}%
  Checks Passed      : ${checksPassed}/${totalChecks} (${checkPassPct}%)
`;

  const outputs = {
    stdout: textReport,
  };

  try {
    outputs[jsonFilename] = JSON.stringify(data, null, 2);
    outputs[txtFilename] = textReport;
  } catch {
    // If saving file fails, stdout report is still cleanly returned
  }

  return outputs;
}
