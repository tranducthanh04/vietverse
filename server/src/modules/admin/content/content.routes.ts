import { Router } from 'express';
import { ContentController as controller } from './content.controller.js';

const router = Router();
router.get('/:kind', controller.list);
router.post('/:kind/drafts', controller.create);
router.get('/:kind/:id', controller.get);
router.post('/:kind/:id/draft', controller.start);
router.put('/:kind/:id/draft', controller.save);
router.post('/:kind/:id/discard-draft', controller.discard);
router.get('/:kind/:id/preview', controller.preview);
router.post('/:kind/:id/validate', controller.validate);
export default router;
