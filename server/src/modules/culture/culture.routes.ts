import { Router } from 'express';
import { CultureController } from './culture.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// Publicly readable for all learners and guests
router.get('/', CultureController.getArticles);
router.get('/:id', CultureController.getArticle);

// Submitting quiz requires parent/child auth
router.post('/:id/quiz', authMiddleware, CultureController.submitQuiz);

export default router;
