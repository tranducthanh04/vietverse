import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { env } from '../../config/env.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await AuthService.register(validated);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

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

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

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
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return sendError(res, 'Mã làm mới (refresh token) không tồn tại', 401, 'NO_REFRESH_TOKEN');
      }

      const result = await AuthService.refresh(refreshToken);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, { accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return sendSuccess(res, { message: 'Đăng xuất thành công' });
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

  static async googleAuthPlaceholder(req: Request, res: Response) {
    return sendSuccess(res, {
      message: 'Google SSO interface ready for production OAuth client credentials integration',
    });
  }
}
