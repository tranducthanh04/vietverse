import { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';
import { ROLES, UserRole } from '../constants/roles.js';

export interface AuthUserPayload {
  id: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * JWT_SECRET also signs purpose-bound tokens (Parent Gate, gate challenge, CMS image tickets).
 * Access tokens carry neither `aud` nor `purpose`, so any token with them is not a session.
 */
function isAccessTokenPayload(decoded: string | JwtPayload): decoded is JwtPayload & AuthUserPayload {
  if (typeof decoded !== 'object' || decoded === null) return false;
  if (decoded.aud !== undefined || 'purpose' in decoded) return false;
  return typeof decoded.id === 'string' && decoded.id.length > 0 &&
    (Object.values(ROLES) as string[]).includes(decoded.role);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      sendError(res, 'Yêu cầu đăng nhập để tiếp tục', 401, 'UNAUTHORIZED');
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!isAccessTokenPayload(decoded)) {
      sendError(res, 'Mã xác thực không hợp lệ', 401, 'INVALID_TOKEN');
      return;
    }
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Phiên đăng nhập đã hết hạn, vui lòng làm mới token', 401, 'TOKEN_EXPIRED');
      return;
    }
    sendError(res, 'Mã xác thực không hợp lệ', 401, 'INVALID_TOKEN');
  }
}
