import { Request, Response, NextFunction } from 'express';
import { StoriesService } from './stories.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export class StoriesController {
  static async getStories(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, ageGroup, search } = req.query;
      const stories = await StoriesService.getStories({
        type: type as any,
        ageGroup: ageGroup as string,
        search: search as string,
      });
      return sendSuccess(res, stories);
    } catch (error) {
      next(error);
    }
  }

  static async getStory(req: Request, res: Response, next: NextFunction) {
    try {
      const story = await StoriesService.getStoryById(req.params.id);
      return sendSuccess(res, story);
    } catch (error) {
      next(error);
    }
  }

  static async markExplored(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const { childId } = req.body;
      if (!childId) {
        return sendError(res, 'Thiếu childId', 400);
      }
      const log = await StoriesService.markExplored(req.params.id, childId, parentId);
      return sendSuccess(res, log);
    } catch (error) {
      next(error);
    }
  }
}
