import { Router } from 'express';
import { LessonsController } from './lessons.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/:id', LessonsController.getLesson);
router.post('/:id/complete', LessonsController.completeLesson);

export default router;
