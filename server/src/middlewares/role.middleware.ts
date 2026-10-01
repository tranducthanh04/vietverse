import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants/roles.js';
import { sendError } from '../utils/apiResponse.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Yêu cầu đăng nhập', 401, 'UNAUTHORIZED');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Bạn không có quyền thực hiện thao tác này', 403, 'FORBIDDEN');
      return;
    }

    next();
  };
}
