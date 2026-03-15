import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { AppError } from '../types/errors';

export function adminOnly(req: Request, _res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? '';
  const normalized = ip.replace('::ffff:', '');
  if (env.ADMIN_ALLOWED_IPS.includes(normalized) || env.ADMIN_ALLOWED_IPS.includes(ip)) {
    return next();
  }
  next(AppError.forbidden('Admin access is only available from localhost'));
}
