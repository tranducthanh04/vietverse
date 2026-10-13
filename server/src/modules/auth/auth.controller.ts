import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { refreshCookieMaxAgeMs, sessionCookieOptions } from './auth.cookies.js';

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie('refreshToken', refreshToken, { ...sessionCookieOptions, maxAge: refreshCookieMaxAgeMs });
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await AuthService.register(validated);
      setRefreshCookie(res, result.refreshToken);

      return sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated);
      setRefreshCookie(res, result.refreshToken);

      return sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      res.setHeader('Cache-Control', 'no-store');
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return sendError(res, 'Mã làm mới (refresh token) không tồn tại', 401, 'NO_REFRESH_TOKEN');
      }

      const result = await AuthService.refresh(refreshToken);
      setRefreshCookie(res, result.refreshToken);

      // One-request bootstrap: same user/subscription shape as GET /auth/me, plus the access token.
      return sendSuccess(res, { accessToken: result.accessToken, user: result.user, subscription: result.subscription });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const userId = req.user?.id;
      await AuthService.logout(refreshToken, userId);

      res.clearCookie('refreshToken', sessionCookieOptions);
      return sendSuccess(res, { message: 'Đăng xuất thành công' });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Chưa đăng nhập', 401);
      }
      const result = await AuthService.getMe(userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

}
