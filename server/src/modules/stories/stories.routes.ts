import { Router } from 'express';
import { StoriesController } from './stories.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', StoriesController.getStories);
router.get('/:id', StoriesController.getStory);
router.post('/:id/explored', StoriesController.markExplored);

export default router;
