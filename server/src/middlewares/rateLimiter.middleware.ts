import rateLimit, { type Store } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { MongoRateLimitStore } from './mongoRateLimitStore.js';
import { getClientRateLimitKey } from './clientIp.js';
import { sendError } from '../utils/apiResponse.js';

export function createRateLimiter(scope: 'api' | 'auth', store?: Store): RequestHandler {
  const limiter = rateLimit({
  windowMs: scope === 'auth' ? 15 * 60 * 1000 : 60 * 1000,
  max: scope === 'auth' ? 30 : 120,
  keyGenerator: getClientRateLimitKey,
  store: store ?? (env.NODE_ENV === 'production' ? new MongoRateLimitStore(scope) : undefined),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: scope === 'auth' ? 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' : 'Hệ thống đang bận, vui lòng thao tác chậm lại.',
    },
  },
  });
  return (req, res, next) => {
    void limiter(req, res, error => {
      if (error) {
        sendError(res, 'Bảo vệ truy cập chưa sẵn sàng. Vui lòng thử lại.', 503, 'RATE_LIMIT_UNAVAILABLE');
      } else next();
    });
  };
}

export const authLimiter = createRateLimiter('auth');
export const apiLimiter = createRateLimiter('api');

type UserRateWindow = { scope: string; windowMs: number; max: number; message: string };

// Separate Mongo bucket namespace per window; the shared store class is reused unchanged.
function userScopedMongoStore(scope: string): Store {
  const store = new MongoRateLimitStore('api');
  store.prefix = `user-${scope}:`;
  return store;
}

/**
 * Per-account limiter for authenticated routes (mount after authMiddleware).
 * Every window must pass; falls back to the client IP key when no user is attached.
 */
export function createUserRateLimiter(windows: UserRateWindow[], storeFor?: (scope: string) => Store | undefined): RequestHandler {
  const limiters = windows.map(window => rateLimit({
    windowMs: window.windowMs,
    max: window.max,
    keyGenerator: req => (req.user?.id ? `user:${req.user.id}` : `ip:${getClientRateLimitKey(req)}`),
    store: storeFor ? storeFor(window.scope) : env.NODE_ENV === 'production' ? userScopedMongoStore(window.scope) : undefined,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: window.message } },
  }));
  return (req, res, next) => {
    const run = (index: number) => {
      if (index >= limiters.length) return next();
      void limiters[index](req, res, error => {
        if (error) sendError(res, 'Bảo vệ truy cập chưa sẵn sàng. Vui lòng thử lại.', 503, 'RATE_LIMIT_UNAVAILABLE');
        else run(index + 1);
      });
    };
    run(0);
  };
}

// Each intent signs a provider upload; cap issuance per account (M3).
export const recordingUploadIntentLimiter = createUserRateLimiter([
  { scope: 'recording-intent-min', windowMs: 60 * 1000, max: 10, message: 'Bé gửi thu âm hơi nhanh. Vui lòng đợi một phút rồi gửi lại.' },
  { scope: 'recording-intent-day', windowMs: 24 * 60 * 60 * 1000, max: 200, message: 'Tài khoản đã gửi quá nhiều bản thu hôm nay. Vui lòng thử lại vào ngày mai.' },
]);
