import { Request, Response, NextFunction } from 'express';
import { LessonsService } from './lessons.service.js';
import { completeLessonSchema, lessonIdParamSchema, lessonQuerySchema } from './lessons.validation.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class LessonsController {
  static async getLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const { childId, contentVersion, activityContract } = lessonQuerySchema.parse(req.query);
      const lessonId = lessonIdParamSchema.parse(req.params.id);
      const lesson = await LessonsService.getLessonById(lessonId, parentId, childId, contentVersion, activityContract);
      return sendSuccess(res, lesson);
    } catch (error) {
      next(error);
    }
  }

  static async completeLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const lessonId = lessonIdParamSchema.parse(req.params.id);
      const validated = completeLessonSchema.parse(req.body);
      const result = await LessonsService.completeLesson(lessonId, parentId, validated);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
