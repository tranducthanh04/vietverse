import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

router.get('/kpi', AdminController.getKPIs);
router.get('/learners', AdminController.getLearners);
router.get('/redemptions', AdminController.getRedemptions);
router.patch('/redemptions/:id', AdminController.updateRedemption);
router.get('/lessons', AdminController.getLessons);
router.post('/lessons', AdminController.createLesson);
router.put('/lessons/:id', AdminController.updateLesson);

export default router;
