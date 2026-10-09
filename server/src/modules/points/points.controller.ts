import { Request, Response, NextFunction } from 'express';
import { PointsService } from './points.service.js';
import { childPointsQuerySchema, equipItemSchema, redeemItemSchema } from './points.validation.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class PointsController {
  static async getChildPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const childId = req.params.childId;
      const page = childPointsQuerySchema.parse(req.query);
      const data = await PointsService.getChildPoints(childId, parentId, page);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getChildCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await PointsService.getChildCollection(req.params.childId, req.user!.id);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async equip(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = equipItemSchema.parse(req.body);
      const data = await PointsService.equipItem(req.params.childId, req.user!.id, validated);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getShopItems(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await PointsService.getShopItems();
      return sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  }

  static async redeem(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const validated = redeemItemSchema.parse(req.body);
      const result = await PointsService.redeemItem(parentId, validated);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
