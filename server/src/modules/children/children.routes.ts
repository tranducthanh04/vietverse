import { Router } from 'express';
import { ChildrenController } from './children.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', ChildrenController.getChildren);
router.post('/', ChildrenController.createChild);
router.get('/:id', ChildrenController.getChild);
router.put('/:id', ChildrenController.updateChild);
router.delete('/:id', ChildrenController.deleteChild);
router.patch('/:id/select', ChildrenController.selectChild);

export default router;
