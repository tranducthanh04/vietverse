import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { RecordingsController } from './recordings.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { recordingUploadIntentLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { MAX_RECORDING_BYTES } from '../../services/localAudioStorage.js';
import { sendError } from '../../utils/apiResponse.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RECORDING_BYTES },
});

// Run multer, then translate its size-limit error into a 413 (the service re-checks the
// byte length too). The file format is validated by magic bytes in the service, not here.
const acceptAudio: RequestHandler = (req, res, next) => {
  upload.single('audio')(req, res, (err: unknown) => {
    if (!err) return next();
    if ((err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'Bản thu âm vượt quá 5 MiB.', 413, 'AUDIO_TOO_LARGE');
    }
    next(err);
  });
};

const router = Router();

// Public playback: an <audio> element cannot send a Bearer token, so this route is authorized
// by the signed `t` query param and therefore must sit ahead of the Bearer-auth gate.
router.get('/:id/audio', RecordingsController.streamAudio);

// Retired Cloudinary signed-upload flow: answer old clients with a clear 410, no auth needed.
router.post('/upload-intent', RecordingsController.flowMoved);
router.post('/finalize', RecordingsController.flowMoved);

router.use(authMiddleware);
router.post('/upload', recordingUploadIntentLimiter, acceptAudio, RecordingsController.upload);
router.get('/children/:childId', RecordingsController.getByChild);

export default router;
