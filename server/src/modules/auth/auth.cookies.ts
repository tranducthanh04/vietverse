import type { CookieOptions } from 'express';
import { env } from '../../config/env.js';

/**
 * Session cookies are first-party: the FE proxies `/api/*` to the backend, so browser calls are
 * same-origin and `SameSite=Lax` is enough. Lax stops other sites from sending these cookies on
 * cross-site POST/fetch requests. Secure stays on in production.
 */
export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export const refreshCookieMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
