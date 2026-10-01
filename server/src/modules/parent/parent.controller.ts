import { Request, Response, NextFunction } from 'express';
import { ParentService } from './parent.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export class ParentController {
  static async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const childId = req.params.childId;
      const progress = await ParentService.getChildCompetencyProgress(childId, parentId);
      return sendSuccess(res, progress);
    } catch (error) {
      next(error);
    }
  }

  static async updateScreenTime(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const { childId, limitMinutes } = req.body;
      if (!childId || limitMinutes === undefined) {
        return sendError(res, 'Thiếu childId hoặc limitMinutes', 400);
      }
      const updatedChild = await ParentService.updateScreenTime(parentId, childId, Number(limitMinutes));
      return sendSuccess(res, updatedChild);
    } catch (error) {
      next(error);
    }
  }
}
