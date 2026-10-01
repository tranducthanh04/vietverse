import { Router } from 'express';
import { ParentController } from './parent.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/progress/:childId', ParentController.getProgress);
router.patch('/screen-time', ParentController.updateScreenTime);

export default router;
