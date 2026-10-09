import { Request, Response, NextFunction } from 'express';
import { CultureService } from './culture.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { z } from 'zod';
import { contentVersionSchema } from '../content/content.reader.js';

const quizSubmission = z.object({
  childId: z.string().regex(/^[a-f\d]{24}$/i),
  contentVersion: contentVersionSchema.optional(),
  answers: z.array(z.object({ questionIndex: z.number().int().min(0), selectedAnswer: z.number().int().min(0) })).max(20),
});

export class CultureController {
  static async getArticles(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, search } = req.query;
      const articles = await CultureService.getArticles({
        category: category as string,
        search: search as string,
      });
      return sendSuccess(res, articles);
    } catch (error) {
      next(error);
    }
  }

  static async getArticle(req: Request, res: Response, next: NextFunction) {
    try {
      const article = await CultureService.getArticleById(req.params.id);
      return sendSuccess(res, article);
    } catch (error) {
      next(error);
    }
  }

  static async submitQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const result = await CultureService.submitQuiz(req.params.id, parentId, quizSubmission.parse(req.body));
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
