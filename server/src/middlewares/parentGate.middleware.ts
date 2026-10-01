import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

export function parentGateMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const gateToken = req.headers['x-parent-gate-token'] as string | undefined;

    if (!gateToken) {
      sendError(
        res,
        'Cần xác thực cổng phụ huynh (Parent Gate) để thực hiện thao tác này',
        403,
        'PARENT_GATE_REQUIRED'
      );
      return;
    }

    const decoded = jwt.verify(gateToken, env.JWT_SECRET) as any;
    if (decoded.purpose !== 'parent_gate' || decoded.userId !== req.user?.id) {
      sendError(
        res,
        'Phiên xác thực cổng phụ huynh không hợp lệ hoặc không thuộc tài khoản hiện tại',
        403,
        'PARENT_GATE_INVALID'
      );
      return;
    }

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Phiên cổng phụ huynh đã hết hạn, vui lòng xác thực lại', 403, 'PARENT_GATE_EXPIRED');
      return;
    }
    sendError(res, 'Phiên xác thực cổng phụ huynh không hợp lệ', 403, 'PARENT_GATE_INVALID');
  }
}
