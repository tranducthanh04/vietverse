import { Request, Response, NextFunction } from 'express';
import { StagesService } from './stages.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class StagesController {
  static async getStages(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const childId = req.query.childId as string | undefined;
      const stages = await StagesService.getStagesForChild(parentId, childId);
      return sendSuccess(res, stages);
    } catch (error) {
      next(error);
    }
  }
}
