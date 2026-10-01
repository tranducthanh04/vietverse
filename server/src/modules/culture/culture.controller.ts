import { Request, Response, NextFunction } from 'express';
import { CultureService } from './culture.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

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
      const { childId, answers } = req.body;
      if (!childId || !Array.isArray(answers)) {
        return sendError(res, 'Dữ liệu trắc nghiệm không hợp lệ', 400);
      }
      const result = await CultureService.submitQuiz(req.params.id, parentId, {
        childId,
        answers,
      });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
