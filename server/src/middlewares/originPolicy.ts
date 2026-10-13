import type { NextFunction, Request, Response } from 'express';
import type { CorsOptions } from 'cors';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

export interface OriginConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  CLIENT_ORIGIN: string;
  CLIENT_ORIGINS?: string;
}

// Local Vite origins are only trusted outside production.
const localOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

/** Origins named by the operator: CLIENT_ORIGIN plus comma-separated CLIENT_ORIGINS. */
export function configuredOrigins(config: OriginConfig): Set<string> {
  const values = [config.CLIENT_ORIGIN, ...(config.CLIENT_ORIGINS ?? '').split(',')]
    .map(value => value.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
    .filter((origin): origin is string => origin !== null);
  // Production credentials must never be offered to a plain-HTTP origin.
  return new Set(config.NODE_ENV === 'production' ? values.filter(origin => origin.startsWith('https://')) : values);
}

export function createOriginPolicy(config: OriginConfig) {
  const configured = configuredOrigins(config);
  const allowed = new Set(config.NODE_ENV === 'production' ? configured : [...configured, ...localOrigins]);
  const permissive = config.NODE_ENV === 'development';
  const isAllowed = (origin: string) => permissive || allowed.has(origin);

  const reject = (res: Response, code: string, message: string) => {
    res.setHeader('Cache-Control', 'no-store');
    sendError(res, message, 403, code);
  };

  return {
    isAllowed,
    /** Global gate: a browser request from an unknown origin gets a clean 403 without CORS headers. */
    guard(req: Request, res: Response, next: NextFunction): void {
      const origin = req.get('Origin');
      if (origin === undefined || isAllowed(origin)) return next();
      res.vary('Origin');
      reject(res, 'ORIGIN_NOT_ALLOWED', 'Nguồn truy cập không được phép gọi API Vietverse.');
    },
    cors: {
      // Requests without Origin (curl, webhooks, server-to-server) carry no browser credentials risk.
      origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) =>
        callback(null, origin === undefined || isAllowed(origin)),
      credentials: true,
    } satisfies CorsOptions,
    /**
     * Cookie-authenticated POSTs: browsers always send Origin on POST, so reject only when an
     * Origin is present and untrusted. Requests without Origin are non-browser clients.
     */
    sessionOrigin(req: Request, res: Response, next: NextFunction): void {
      const origin = req.get('Origin');
      if (origin === undefined || isAllowed(origin)) return next();
      reject(res, 'ORIGIN_NOT_ALLOWED', 'Hãy thao tác phiên đăng nhập từ trang Vietverse chính thức.');
    },
    /** Google sign-in requires an Origin that is also registered in Google Cloud Console. */
    googleOrigin(req: Request, res: Response, next: NextFunction): void {
      res.setHeader('Cache-Control', 'no-store');
      const origin = req.get('Origin');
      if (origin !== undefined && configured.has(origin)) return next();
      reject(res, 'GOOGLE_ORIGIN_INVALID', 'Hãy đăng nhập Google từ trang Vietverse chính thức.');
    },
  };
}

export const originPolicy = createOriginPolicy(env);
