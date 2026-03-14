import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../shared/types/errors.types';

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed as typeof req.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);
      } else {
        next(AppError.validationError('Invalid request body'));
      }
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);
      } else {
        next(AppError.validationError('Invalid request parameters'));
      }
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);
      } else {
        next(AppError.validationError('Invalid query parameters'));
      }
    }
  };
}
