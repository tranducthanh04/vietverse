import { Router } from 'express';
import { StagesController } from './stages.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', StagesController.getStages);

export default router;
