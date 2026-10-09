import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import {
  updateRedemptionSchema,
  createLessonSchema,
  updateLessonSchema,
  updateInventorySchema,
} from './admin.validation.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class AdminController {
  static async getKPIs(_req: Request, res: Response, next: NextFunction) {
    try {
      const kpis = await AdminService.getKPIs();
      return sendSuccess(res, kpis);
    } catch (error) {
      next(error);
    }
  }

  static async getLearners(_req: Request, res: Response, next: NextFunction) {
    try {
      const learners = await AdminService.getLearners();
      return sendSuccess(res, learners);
    } catch (error) {
      next(error);
    }
  }

  static async getLearnerDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const learner = await AdminService.getLearnerDetail(req.params.id);
      return sendSuccess(res, learner);
    } catch (error) {
      next(error);
    }
  }

  static async getRedemptions(_req: Request, res: Response, next: NextFunction) {
    try {
      const redemptions = await AdminService.getRedemptions();
      return sendSuccess(res, redemptions);
    } catch (error) {
      next(error);
    }
  }

  static async updateRedemption(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateRedemptionSchema.parse(req.body);
      const updated = await AdminService.updateRedemption(req.params.id, validated, req.user?.id);
      return sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async getLessons(_req: Request, res: Response, next: NextFunction) {
    try {
      const lessons = await AdminService.getAllLessons();
      return sendSuccess(res, lessons);
    } catch (error) {
      next(error);
    }
  }

  static async createLesson(req: Request, res: Response, next: NextFunction) {
    try {
      createLessonSchema.parse(req.body);
      throw { statusCode: 409, code: 'CONTENT_CMS_REQUIRED', message: 'Hãy biên tập và xuất bản qua CMS.' };
    } catch (error) {
      next(error);
    }
  }

  static async updateLesson(req: Request, res: Response, next: NextFunction) {
    try {
      updateLessonSchema.parse(req.body);
      throw { statusCode: 409, code: 'CONTENT_CMS_REQUIRED', message: 'Hãy biên tập và xuất bản qua CMS.' };
    } catch (error) {
      next(error);
    }
  }

  static async getInventory(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await AdminService.getInventory();
      return sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  }

  static async updateInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateInventorySchema.parse(req.body);
      const item = await AdminService.updateInventory(req.params.id, validated, req.user?.id);
      return sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(_req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await AdminService.getAuditLogs();
      return sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  }
}
