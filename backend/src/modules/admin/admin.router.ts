import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { usersService } from '../users/users.service';
import { adminOnly } from '../../shared/middleware/adminOnly';
import { query, queryOne } from '../../db/client';

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

// GET /api/admin/stats — overall app stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, sessions, progress, apiCalls] = await Promise.all([
      queryOne<Record<string, string>>('SELECT COUNT(*) as total FROM users'),
      queryOne<Record<string, string>>('SELECT COUNT(*) as total, SUM(CASE WHEN status=\'completed\' THEN 1 ELSE 0 END) as completed FROM learning_sessions'),
      queryOne<Record<string, string>>('SELECT COUNT(*) as total, AVG(best_score) as avg_score FROM user_progress'),
      queryOne<Record<string, string>>('SELECT COUNT(*) as total FROM api_usage_log'),
    ]);
    res.json({ success: true, data: { users, sessions, progress, apiCalls } });
  } catch (err) { next(err); }
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

// GET /api/admin/users/:id — user detail with sessions, progress, attempts
router.get('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.findById(req.params['id']!);
    const [sessions, progress] = await Promise.all([
      query<Record<string, unknown>>(
        `SELECT ls.id, ls.theme_slug, ls.class_level, ls.subject, ls.chapter_index, ls.status, ls.started_at, ls.completed_at,
                COUNT(ea.id) as attempt_count, AVG(ea.score) as avg_score
         FROM learning_sessions ls
         LEFT JOIN evaluation_attempts ea ON ea.session_id = ls.id
         WHERE ls.user_id = $1
         GROUP BY ls.id ORDER BY ls.started_at DESC`,
        [user.id]
      ),
      query<Record<string, unknown>>(
        `SELECT class_level, subject, chapter_index, best_score, attempts, status, completed_at
         FROM user_progress WHERE user_id=$1 ORDER BY class_level, subject, chapter_index`,
        [user.id]
      ),
    ]);
    res.json({ success: true, data: { user, sessions, progress } });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id — edit fields + optional PIN reset
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

// DELETE /api/admin/users/:id/data — clear user data (keep account)
// Query params: ?classLevel=X&subject=Y for selective clear
router.delete('/users/:id/data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classLevel = req.query['classLevel'] ? parseInt(req.query['classLevel'] as string) : undefined;
    const subject = req.query['subject'] as string | undefined;
    await usersService.clearUserData(req.params['id']!, classLevel, subject);
    res.json({ success: true });
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
