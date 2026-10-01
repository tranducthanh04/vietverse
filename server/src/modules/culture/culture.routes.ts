import { Router } from 'express';
import { CultureController } from './culture.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', CultureController.getArticles);
router.get('/:id', CultureController.getArticle);
router.post('/:id/quiz', CultureController.submitQuiz);

export default router;
