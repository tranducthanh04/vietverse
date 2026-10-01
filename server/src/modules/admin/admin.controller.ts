import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
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
      const updated = await AdminService.updateRedemption(req.params.id, req.body);
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
      const lesson = await AdminService.createLesson(req.body);
      return sendSuccess(res, lesson, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const lesson = await AdminService.updateLesson(req.params.id, req.body);
      return sendSuccess(res, lesson);
    } catch (error) {
      next(error);
    }
  }
}
