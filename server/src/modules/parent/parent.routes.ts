import { Router } from 'express';
import { ParentController } from './parent.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { parentGateMiddleware } from '../../middlewares/parentGate.middleware.js';

const router = Router();

router.use(authMiddleware);

// Gate challenge & verification
router.get('/gate/challenge', ParentController.getChallenge);
router.post('/gate/verify', ParentController.verifyGate);

// Protected endpoints requiring step-up auth (X-Parent-Gate-Token)
router.get('/progress/:childId', parentGateMiddleware, ParentController.getProgress);
router.patch('/screen-time', parentGateMiddleware, ParentController.updateScreenTime);

export default router;
