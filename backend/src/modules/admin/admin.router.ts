import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { usersService } from '../users/users.service';
import { adminOnly } from '../../shared/middleware/adminOnly';

const router = Router();
router.use(adminOnly);

const createUserSchema = z.object({
  fullName: z.string().min(1).max(255),
  displayName: z.string().min(1).max(100),
  level: z.number().int().min(1).max(12),
  pin: z.string().length(6).regex(/^\d{6}$/).optional(),
});

const updateLevelSchema = z.object({ level: z.number().int().min(1).max(12) });

const adminUpdateUserSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  displayName: z.string().min(1).max(100).optional(),
  level: z.number().int().min(1).max(12).optional(),
  pin: z.string().length(6).regex(/^\d{6}$/).or(z.literal('')).optional(),
});

// GET /api/admin/users
router.get('/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await usersService.findAll();
    res.json({ success: true, data: { users } });
  } catch (err) { next(err); }
});

// POST /api/admin/users
router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = createUserSchema.parse(req.body);
    const { user, pin } = await usersService.create(dto);
    res.status(201).json({ success: true, data: { user, pin } });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id — edit any user fields + optional PIN reset
router.patch('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = adminUpdateUserSchema.parse(req.body);
    const result = await usersService.adminUpdate(req.params['id']!, dto);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/level (kept for home component compatibility)
router.patch('/users/:id/level', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level } = updateLevelSchema.parse(req.body);
    const user = await usersService.updateLevel(req.params['id']!, level);
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await usersService.delete(req.params['id']!, {});
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
