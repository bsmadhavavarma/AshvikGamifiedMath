import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/types/errors';
import { usersRepository } from '../users/users.repository';
import { rowToUser } from '../users/users.types';

export interface AuthRequest extends Request {
  userId?: string;
  userLevel?: number;
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return next(AppError.unauthorized('Not logged in'));
  req.userId = userId;
  next();
}

export async function loadUser(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return next(AppError.unauthorized('Not logged in'));
    const row = await usersRepository.findById(userId);
    if (!row) return next(AppError.unauthorized('User not found'));
    req.userId = row.id;
    req.userLevel = rowToUser(row).level;
    next();
  } catch (err) {
    next(err);
  }
}
