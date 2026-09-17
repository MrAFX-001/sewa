/**
 * Environment configuration for SEWA 2026 k6 load-testing suite.
 *
 * Configurable via environment variables:
 *   BASE_URL - Target base URL (defaults to http://10.50.0.80)
 */

export const DEFAULT_BASE_URL = 'http://10.50.0.80';

export function getBaseUrl() {
  const envUrl = __ENV.BASE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_BASE_URL;
}

export const ENDPOINTS = {
  // Public Frontend SSR Pages
  pages: {
    home: '/',
    about: '/about',
    problemStatements: '/problem-statements',
    guidelines: '/guidelines',
    events: '/events',
    faq: '/faq',
    contact: '/contact',
    resources: '/resources',
    signin: '/signin',
    signup: '/signup',
    teamRegister: '/team-register',
  },

  // Public Static Assets
  static: {
    logo: '/dtu_logo.png',
    favicon: '/favicon.ico',
    robots: '/robots.txt',
  },

  // Public Backend APIs (Safe read-only)
  publicApi: {
    health: '/api/health',
    announcements: '/api/announcements',
  },

  // Authenticated APIs (Safe read-only when session is provided)
  authApi: {
    signin: '/api/auth/signin',
    me: '/api/auth/me',
    profile: '/api/profile',
    myTeam: '/api/register/me',
  },
};

export const DEFAULT_HEADERS = {
  'User-Agent': 'k6-load-test/1.0 (SEWA 2026 Performance Suite)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
};

export const JSON_HEADERS = {
  'User-Agent': 'k6-load-test/1.0 (SEWA 2026 Performance Suite)',
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'Connection': 'keep-alive',
};




