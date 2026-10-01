import { Router } from 'express';
import { StoriesController } from './stories.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// Publicly readable for all learners and guests
router.get('/', StoriesController.getStories);
router.get('/:id', StoriesController.getStory);

// Tracking exploration requires parent/child auth
router.post('/:id/explored', authMiddleware, StoriesController.markExplored);

export default router;
