import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { GoogleAuthController, googleOrigin } from './google.controller.js';

const router = Router();

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authMiddleware, AuthController.getMe);
router.get('/google', GoogleAuthController.config);
router.post('/google/start', googleOrigin, authLimiter, GoogleAuthController.start);
router.post('/google', googleOrigin, authLimiter, GoogleAuthController.signIn);
router.post('/google/link', googleOrigin, authLimiter, GoogleAuthController.link);
router.post('/google/cancel', googleOrigin, authLimiter, GoogleAuthController.cancel);

export default router;
