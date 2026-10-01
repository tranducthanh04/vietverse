import { Request, Response, NextFunction } from 'express';
import { PointsService } from './points.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export class PointsController {
  static async getChildPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const childId = req.params.childId;
      const data = await PointsService.getChildPoints(childId, parentId);
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
      const { childId, itemId, shippingAddress } = req.body;
      if (!childId || !itemId) {
        return sendError(res, 'Thiếu childId hoặc itemId', 400);
      }

      const result = await PointsService.redeemItem(parentId, {
        childId,
        itemId,
        shippingAddress,
      });

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
