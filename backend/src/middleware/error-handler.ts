import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/types/errors.types';
import { logger } from '../config/logger';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const timestamp = new Date().toISOString();

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn({ err: err.message, details, path: req.path }, 'Validation error');
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
      },
      timestamp,
    };
    res.status(422).json(response);
    return;
  }

  // Handle operational AppErrors
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, path: req.path }, 'Non-operational AppError');
    } else {
      logger.warn({ code: err.code, message: err.message, path: req.path }, 'Application error');
    }
    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
      timestamp,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unknown errors
  logger.error({ err, path: req.path }, 'Unhandled error');
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    timestamp,
  };
  res.status(500).json(response);
}
