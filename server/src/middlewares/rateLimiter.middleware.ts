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
