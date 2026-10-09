import { Router } from 'express';
import multer from 'multer';
import { RecordingsController } from './recordings.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/ogg') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận tập tin âm thanh hợp lệ (audio/webm, audio/mp4, mp3, wav, ogg)'));
    }
  },
});

const router = Router();

router.use(authMiddleware);
router.post('/upload-intent', RecordingsController.createIntent);

router.post('/', upload.single('audio'), RecordingsController.upload);
router.get('/children/:childId', RecordingsController.getByChild);

export default router;
