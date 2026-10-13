import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { GoogleAuthController } from './google.controller.js';
import { originPolicy } from '../../middlewares/originPolicy.js';

const googleOrigin = originPolicy.googleOrigin;
const sessionOrigin = originPolicy.sessionOrigin;

const router = Router();

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
// Cookie-authenticated session endpoints reject untrusted browser origins (CSRF defence in depth).
router.post('/refresh', sessionOrigin, AuthController.refresh);
router.post('/logout', sessionOrigin, AuthController.logout);
router.get('/me', authMiddleware, AuthController.getMe);
router.get('/google', GoogleAuthController.config);
router.post('/google/start', googleOrigin, authLimiter, GoogleAuthController.start);
router.post('/google', googleOrigin, authLimiter, GoogleAuthController.signIn);
router.post('/google/link', googleOrigin, authLimiter, GoogleAuthController.link);
router.post('/google/cancel', googleOrigin, authLimiter, GoogleAuthController.cancel);

export default router;
