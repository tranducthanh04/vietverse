import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authMiddleware, AuthController.getMe);
router.get('/google', AuthController.googleAuthPlaceholder);

export default router;
