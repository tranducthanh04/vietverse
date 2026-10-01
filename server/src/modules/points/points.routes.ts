import { Router } from 'express';
import { PointsController } from './points.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/shop/items', PointsController.getShopItems);
router.post('/shop/redeem', PointsController.redeem);
router.get('/children/:childId', PointsController.getChildPoints);

export default router;
