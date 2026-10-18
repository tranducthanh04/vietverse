import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { GoogleAuthService } from './google.service.js';
import { sessionCookieOptions, setSessionCookies } from './auth.cookies.js';

const cookieName = env.NODE_ENV === 'production' ? '__Host-vietverse_google' : 'vietverse_google';
const cookieOptions = sessionCookieOptions;
const nonceSchema = z.string().regex(/^[a-f0-9]{64}$/);
const credentialSchema = z.object({ nonce: nonceSchema, credential: z.string().min(1).max(12000) }).strict();
const linkSchema = z.object({ nonce: nonceSchema, password: z.string().min(1).max(256) }).strict();
const cancelSchema = z.object({ nonce: nonceSchema }).strict();

export class GoogleAuthController {
  static async config(_req: Request, res: Response, next: NextFunction) {
    try { res.setHeader('Cache-Control', 'no-store'); return sendSuccess(res, GoogleAuthService.config()); } catch (error) { next(error); }
  }

  static async start(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, ...data } = await GoogleAuthService.start(req.cookies?.[cookieName]);
      res.cookie(cookieName, token, { ...cookieOptions, maxAge: 5 * 60_000 });
      return sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  static async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { credential, nonce } = credentialSchema.parse(req.body);
      const result = await GoogleAuthService.signIn(req.cookies?.[cookieName], nonce, credential);
      if ('linkRequired' in result) return sendSuccess(res, result);
      return GoogleAuthController.finish(res, result);
    } catch (error) { next(error); }
  }

  static async link(req: Request, res: Response, next: NextFunction) {
    try {
      const { nonce, password } = linkSchema.parse(req.body);
      return GoogleAuthController.finish(res, await GoogleAuthService.link(req.cookies?.[cookieName], nonce, password));
    } catch (error) { next(error); }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { nonce } = cancelSchema.parse(req.body);
      await GoogleAuthService.cancel(req.cookies?.[cookieName], nonce);
      // Do not clear a cookie which a newer flow in another tab may already have replaced.
      return sendSuccess(res, { cancelled: true });
    } catch (error) { next(error); }
  }

  private static finish(res: Response, result: { user: unknown; accessToken: string; refreshToken: string }) {
    res.clearCookie(cookieName, cookieOptions);
    setSessionCookies(res, result.refreshToken);
    return sendSuccess(res, { user: result.user, accessToken: result.accessToken });
  }
}
