import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service.js';
import { createCheckoutSchema, webhookSchema } from './payments.validation.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import type { Webhook } from '@payos/node';

export class PaymentsController {
  static async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCheckoutSchema.parse(req.body);
      const parentId = req.user!.id;
      const result = await PaymentsService.createCheckout(parentId, parsed);
      return sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = webhookSchema.parse(req.body) as Webhook;
      const result = await PaymentsService.handleWebhook(parsed);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const history = await PaymentsService.getPaymentHistory(parentId);
      return sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.user!.id;
      const { orderCode } = req.params;
      const order = await PaymentsService.getOrderDetails(orderCode, parentId);
      return sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }
}
