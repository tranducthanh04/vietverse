import { Router } from 'express';
import { contentTypeForExt, localAudioStorage } from '../../services/localAudioStorage.js';
import { serveAudioFile } from '../../utils/audioStream.js';
import { sendError } from '../../utils/apiResponse.js';

const router = Router();

// Public, long-cached content audio. The file name is a content hash, validated by a strict
// regex in contentKeyForName, which also blocks any path-traversal attempt.
router.get('/audio/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const storageKey = localAudioStorage.contentKeyForName(name);
    if (!storageKey) {
      return sendError(res, 'Tên tập tin âm thanh không hợp lệ.', 400, 'AUDIO_NAME_INVALID');
    }
    const ext = name.split('.').pop() ?? '';
    await serveAudioFile(req, res, storageKey, {
      contentType: contentTypeForExt(ext),
      cacheControl: 'public, max-age=31536000, immutable',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
