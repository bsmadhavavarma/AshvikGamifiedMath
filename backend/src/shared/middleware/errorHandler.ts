import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors';
import { logger } from '../../config/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
    return;
  }
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}
