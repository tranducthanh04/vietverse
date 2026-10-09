import { Request, Response, NextFunction } from 'express';
import { LessonsService } from './lessons.service.js';
import { completeLessonSchema, lessonQuerySchema } from './lessons.validation.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class LessonsController {
  static async getLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const { childId, contentVersion } = lessonQuerySchema.parse(req.query);
      const lesson = await LessonsService.getLessonById(req.params.id, parentId, childId, contentVersion);
      return sendSuccess(res, lesson);
    } catch (error) {
      next(error);
    }
  }

  static async completeLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const lessonId = req.params.id;
      const validated = completeLessonSchema.parse(req.body);
      const result = await LessonsService.completeLesson(lessonId, parentId, validated);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
