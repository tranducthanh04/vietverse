import { Request, Response, NextFunction } from 'express';
import { RecordingsService } from './recordings.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export class RecordingsController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendError(res, 'Vui lòng đính kèm tập tin âm thanh', 400);
      }

      const parentId = req.user!.id;
      const { childId, lessonId, activityId, durationSec, wordOrPrompt } = req.body;

      if (!childId) {
        return sendError(res, 'Thiếu childId', 400);
      }

      const recording = await RecordingsService.uploadRecording(parentId, {
        childId,
        lessonId,
        activityId,
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
