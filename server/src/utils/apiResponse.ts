import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  code?: string,
  details?: any
): Response {
  const body: ApiResponse = {
    success: false,
    error: {
      code: code || 'ERROR',
      message,
      details,
    },
  };
  return res.status(statusCode).json(body);
}
