import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import {
  CONTENT_AUDIO_EXTS, detectAudio, invalidAudio, localAudioStorage, MAX_CONTENT_AUDIO_BYTES,
} from '../../../services/localAudioStorage.js';
import { sendError, sendSuccess } from '../../../utils/apiResponse.js';

// Admin auth and the admin role are already enforced by the parent admin router.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CONTENT_AUDIO_BYTES },
});

const acceptAudio: RequestHandler = (req, res, next) => {
  upload.single('audio')(req, res, (err: unknown) => {
    if (!err) return next();
    if ((err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'Tập tin âm thanh vượt quá 10 MiB.', 413, 'AUDIO_TOO_LARGE');
    }
    next(err);
  });
};

const router = Router();

// POST /api/v1/admin/content/audio — stores narration by content hash, so re-uploading the
// same file returns the same immutable URL.
router.post('/', acceptAudio, async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Vui lòng đính kèm tập tin âm thanh', 400);
    }
    const kind = detectAudio(req.file.buffer);
    // Content audio is delivery narration: accept only the seekable, broadly playable formats.
    if (!kind || !(CONTENT_AUDIO_EXTS as readonly string[]).includes(kind.ext)) throw invalidAudio();
    const { name } = await localAudioStorage.writeContentAudio(kind, req.file.buffer);
    res.setHeader('Cache-Control', 'no-store');
    return sendSuccess(res, { url: `/api/v1/media/audio/${name}` }, 201);
  } catch (error) {
    next(error);
  }
});

export default router;
