import type { CookieOptions, Response } from 'express';
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

/**
 * Non-secret companion cookie that JS can read. It holds no token — only a flag that a refresh
 * session was issued — so the SPA can skip `POST /auth/refresh` on a guest's first load and avoid
 * the 401 the browser logs to the console. The httpOnly `refreshToken` stays the sole credential;
 * this hint never grants access (the server still validates the refresh token on every call).
 */
export const SESSION_HINT_COOKIE = 'vv_has_session';

const sessionHintCookieOptions: CookieOptions = {
  httpOnly: false,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

/**
 * Issue the refresh cookie and its readable hint together so they share one lifecycle and can never
 * diverge. The refresh cookie is written first so callers that read `set-cookie[0]` still get it.
 */
export function setSessionCookies(res: Response, refreshToken: string): void {
  res.cookie('refreshToken', refreshToken, { ...sessionCookieOptions, maxAge: refreshCookieMaxAgeMs });
  res.cookie(SESSION_HINT_COOKIE, '1', { ...sessionHintCookieOptions, maxAge: refreshCookieMaxAgeMs });
}

/** Clear both cookies together (logout). */
export function clearSessionCookies(res: Response): void {
  res.clearCookie('refreshToken', sessionCookieOptions);
  res.clearCookie(SESSION_HINT_COOKIE, sessionHintCookieOptions);
}
