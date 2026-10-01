import { Request, Response, NextFunction } from 'express';
import { ChildrenService } from './children.service.js';
import { createChildSchema, updateChildSchema } from './children.validation.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class ChildrenController {
  static async getChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const children = await ChildrenService.getChildrenByParent(parentId);
      return sendSuccess(res, children);
    } catch (error) {
      next(error);
    }
  }

  static async getChild(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const child = await ChildrenService.getChildById(req.params.id, parentId);
      return sendSuccess(res, child);
    } catch (error) {
      next(error);
    }
  }

  static async createChild(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const validated = createChildSchema.parse(req.body);
      const child = await ChildrenService.createChild(parentId, validated);
      return sendSuccess(res, child, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateChild(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const validated = updateChildSchema.parse(req.body);
      const child = await ChildrenService.updateChild(req.params.id, parentId, validated);
      return sendSuccess(res, child);
    } catch (error) {
      next(error);
    }
  }

  static async deleteChild(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      await ChildrenService.deleteChild(req.params.id, parentId);
      return sendSuccess(res, { message: 'Đã xóa hồ sơ bé thành công' });
    } catch (error) {
      next(error);
    }
  }

  static async selectChild(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const child = await ChildrenService.selectChild(req.params.id, parentId);
      return sendSuccess(res, child);
    } catch (error) {
      next(error);
    }
  }
}
