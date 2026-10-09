import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import contentRouter from './content/content.routes.js';
import pointRulesRouter from './pointRules.routes.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));
router.use('/content', contentRouter);
router.use('/point-rules', pointRulesRouter);

// KPI & Analytics
router.get('/kpi', AdminController.getKPIs);
router.get('/audit-logs', AdminController.getAuditLogs);

// Learners
router.get('/learners', AdminController.getLearners);
router.get('/learners/:id', AdminController.getLearnerDetail);

// Redemptions
router.get('/redemptions', AdminController.getRedemptions);
router.patch('/redemptions/:id', AdminController.updateRedemption);

// Inventory (Shop Items)
router.get('/inventory', AdminController.getInventory);
router.post('/inventory', AdminController.createInventory);
router.patch('/inventory/:id', AdminController.updateInventory);

// Curriculum (Lessons)
router.get('/lessons', AdminController.getLessons);
router.post('/lessons', AdminController.createLesson);
router.put('/lessons/:id', AdminController.updateLesson);

export default router;
