import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({
    msg: err.message,
    name: err.name,
    path: req.path,
    method: req.method,
  });

  // Zod validation error
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Dữ liệu gửi lên không hợp lệ', 400, 'VALIDATION_ERROR', formatted);
    return;
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Dữ liệu';
    sendError(res, `${field} đã tồn tại trong hệ thống`, 409, 'DUPLICATE_KEY');
    return;
  }

  // Multer file upload limit error
  if (err.code === 'LIMIT_FILE_SIZE') {
    sendError(res, 'Tập tin ghi âm vượt quá giới hạn cho phép (5MB)', 400, 'FILE_TOO_LARGE');
    return;
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, 'Định dạng mã định danh (ID) không hợp lệ', 400, 'INVALID_ID');
    return;
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500
      ? 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau'
      : err.message || 'Lỗi không xác định';

  sendError(res, message, statusCode, err.code || 'INTERNAL_ERROR');
}
