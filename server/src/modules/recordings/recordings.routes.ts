import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { RecordingsController } from './recordings.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { recordingUploadIntentLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { env } from '../../config/env.js';
import { sendError } from '../../utils/apiResponse.js';

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

// Legacy multipart upload (resource_type auto, client-declared duration) is off in
// production unless explicitly re-enabled; local/dev clients still use it by default.
export function legacyRecordingUploadEnabled(): boolean {
  const flag = process.env.LEGACY_RECORDING_UPLOAD_ENABLED?.trim().toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return env.NODE_ENV !== 'production';
}
// Runs before multer so a disabled endpoint never buffers the file.
const legacyUploadGate: RequestHandler = (_req, res, next) => {
  if (legacyRecordingUploadEnabled()) return next();
  sendError(res, 'Cách gửi thu âm cũ đã ngừng hoạt động. Vui lòng tải lại trang để gửi bằng cách mới.', 410, 'LEGACY_RECORDING_UPLOAD_DISABLED');
};

const router = Router();

router.use(authMiddleware);
router.post('/upload-intent', recordingUploadIntentLimiter, RecordingsController.createIntent);
router.post('/finalize', RecordingsController.finalize);

router.post('/', legacyUploadGate, upload.single('audio'), RecordingsController.upload);
router.get('/children/:childId', RecordingsController.getByChild);

export default router;
