import { Request, Response, NextFunction } from 'express';
import { RecordingsService } from './recordings.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { z } from 'zod';
import { contentVersionParam } from '../content/content.reader.js';
import { uploadIntentSchema } from './recordings.validation.js';
import { DirectRecordingsService } from './recordings.directUpload.js';

const recordingFields = z.object({
  childId: z.string().regex(/^[a-f\d]{24}$/i),
  lessonId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  activityId: z.string().min(1).optional(),
  contentVersion: contentVersionParam,
  durationSec: z.coerce.number().finite().min(0).optional(),
  wordOrPrompt: z.string().max(5000).optional(),
});

export class RecordingsController {
  static async createIntent(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, await DirectRecordingsService.createIntent(req.user!.id, uploadIntentSchema.parse(req.body)), 201);
    } catch (error) { next(error); }
  }

  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendError(res, 'Vui lòng đính kèm tập tin âm thanh', 400);
      }

      const parentId = req.user!.id;
      const { childId, lessonId, activityId, contentVersion, durationSec, wordOrPrompt } = recordingFields.parse(req.body);

      if (!childId) {
        return sendError(res, 'Thiếu childId', 400);
      }

      const recording = await RecordingsService.uploadRecording(parentId, {
        childId,
        lessonId,
        activityId,
        contentVersion,
        durationSec: durationSec ? Number(durationSec) : 0,
        wordOrPrompt,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      });

      return sendSuccess(res, recording, 201);
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
