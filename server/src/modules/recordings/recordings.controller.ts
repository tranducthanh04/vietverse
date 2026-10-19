import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RecordingsService } from './recordings.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { contentVersionParam } from '../content/content.reader.js';
import { verifyRecordingAudioToken } from './recordings.audioToken.js';
import { contentTypeForExt } from '../../services/localAudioStorage.js';
import { serveAudioFile } from '../../utils/audioStream.js';
import { Recording } from '../../models/Recording.js';

const recordingFields = z.object({
  childId: z.string().regex(/^[a-f\d]{24}$/i),
  lessonId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  activityId: z.string().min(1).optional(),
  contentVersion: contentVersionParam,
  wordOrPrompt: z.string().max(5000).optional(),
});

const objectIdPattern = /^[a-f\d]{24}$/i;

export class RecordingsController {
  // The Cloudinary signed-upload flow (upload-intent + finalize) is retired; audio now lives
  // on the BE disk. Old clients must reload to pick up POST /upload.
  static flowMoved(_req: Request, res: Response) {
    return sendError(res, 'Luồng thu âm đã chuyển sang tải trực tiếp lên máy chủ. Vui lòng tải lại trang.', 410, 'RECORDING_FLOW_MOVED');
  }

  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendError(res, 'Vui lòng đính kèm tập tin âm thanh', 400);
      }
      const parentId = req.user!.id;
      const { childId, lessonId, activityId, contentVersion, wordOrPrompt } = recordingFields.parse(req.body);

      const recording = await RecordingsService.uploadRecording(parentId, {
        childId, lessonId, activityId, contentVersion, wordOrPrompt,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      });

      return sendSuccess(res, recording, 201);
    } catch (error) {
      next(error);
    }
  }

  static async streamAudio(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const token = typeof req.query.t === 'string' ? req.query.t : '';
      if (!objectIdPattern.test(id) || !token || !verifyRecordingAudioToken(token, id)) {
        return sendError(res, 'Liên kết nghe bản thu không hợp lệ hoặc đã hết hạn.', 403, 'RECORDING_TOKEN_INVALID');
      }
      const recording = await Recording.findById(id).select('storageKey mimeType').lean();
      // Recordings made before audio moved to local disk have no storageKey: answer cleanly instead of a 500.
      if (!recording?.storageKey) {
        return sendError(res, 'Không tìm thấy bản thu âm.', 404, 'NOT_FOUND');
      }
      const ext = recording.storageKey.split('.').pop() ?? '';
      await serveAudioFile(req, res, recording.storageKey, {
        contentType: recording.mimeType || contentTypeForExt(ext),
        cacheControl: 'private, no-store',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByChild(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const childId = req.params.childId;
      const recordings = await RecordingsService.getRecordingsByChild(childId, parentId);
      return sendSuccess(res, recordings);
    } catch (error) {
      next(error);
    }
  }
}
