/**
 * Assertion and validation checks for HTTP responses.
 */

import { check } from 'k6';
import { serverError5xxRate, rateLimited429Rate } from './metrics.js';

/**
 * Standard HTTP status check and failure tracking.
 */
export function checkStatus(res, expectedStatus = 200, stepName = 'request') {
  const is5xx = res.status >= 500;
  const is429 = res.status === 429;

  serverError5xxRate.add(is5xx ? 1 : 0);
  rateLimited429Rate.add(is429 ? 1 : 0);

  return check(res, {
    [`${stepName} status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${stepName} no unexpected 5xx`]: (r) => r.status < 500,
  });
}

/**
 * Validates HTML page responses from SSR / frontend router.
 */
export function checkHtmlPage(res, stepName = 'page', expectedText = null) {
  const is5xx = res.status >= 500;
  const is429 = res.status === 429;
  serverError5xxRate.add(is5xx ? 1 : 0);
  rateLimited429Rate.add(is429 ? 1 : 0);

  const ct = res.headers['Content-Type'] || res.headers['content-type'] || '';
  const checks = {
    [`${stepName} status is 200`]: (r) => r.status === 200,
    [`${stepName} is HTML content`]: () => ct.includes('text/html'),
  };

  // Only check body content if body was not discarded
  if (res.body && res.body.length > 0) {
    checks[`${stepName} body not empty`] = (r) => r.body && r.body.length > 0;
    if (expectedText) {
      checks[`${stepName} contains "${expectedText}"`] = (r) =>
        typeof r.body === 'string' && r.body.includes(expectedText);
    }
  }

  return check(res, checks);
}

/**
 * Validates JSON responses from backend APIs.
 */
export function checkJsonResponse(res, stepName = 'api', validator = null) {
  const is5xx = res.status >= 500;
  const is429 = res.status === 429;
  serverError5xxRate.add(is5xx ? 1 : 0);
  rateLimited429Rate.add(is429 ? 1 : 0);

  const ct = res.headers['Content-Type'] || res.headers['content-type'] || '';
  const checks = {
    [`${stepName} status is 200`]: (r) => r.status === 200,
    [`${stepName} is JSON content`]: () => ct.includes('application/json'),
  };

  if (res.body && res.body.length > 0) {
    let parsed = null;
    let parseSuccess = false;
    try {
      parsed = JSON.parse(res.body);
      parseSuccess = true;
    } catch {
      parseSuccess = false;
    }

    checks[`${stepName} valid JSON body`] = () => parseSuccess;

    if (validator && parseSuccess) {
      checks[`${stepName} content validation`] = () => {
        try {
          return validator(parsed);
        } catch {
          return false;
        }
      };
    }
  }

  return check(res, checks);
}

/**
 * Validates GET /api/health endpoint response structure.
 */
export function checkHealthResponse(res) {
  return checkJsonResponse(res, 'GET /api/health', (data) => {
    return data && data.status === 'OK';
  });
}

/**
 * Validates GET /api/announcements endpoint response structure.
 */
export function checkAnnouncementsResponse(res) {
  return checkJsonResponse(res, 'GET /api/announcements', (data) => {
    return Array.isArray(data);
  });
}

/**
 * Validates GET /api/auth/me response.
 */
export function checkAuthMeResponse(res) {
  return checkJsonResponse(res, 'GET /api/auth/me', (data) => {
    return data && data.user && typeof data.user.id === 'string';
  });
}

/**
 * Validates GET /api/profile response.
 */
export function checkProfileResponse(res) {
  return checkJsonResponse(res, 'GET /api/profile', (data) => {
    return data && typeof data === 'object';
  });
}

/**
 * Validates GET /api/register/me response.
 */
export function checkMyTeamResponse(res) {
  return checkJsonResponse(res, 'GET /api/register/me', (data) => {
    // Response has shape { team: null } or { team: { ... } }
    return data && ('team' in data);
  });
}




