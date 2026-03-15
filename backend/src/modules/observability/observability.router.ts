import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../db/client';
import { pool } from '../../db/client';
import { adminOnly } from '../../shared/middleware/adminOnly';
import os from 'os';

const router = Router();
router.use(adminOnly);

router.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query('SELECT 1');
    const mem = process.memoryUsage();
    res.json({
      success: true, data: {
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        memory: { heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024), heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024) },
        cpu: { cores: os.cpus().length, loadAvg: os.loadavg() },
        freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
        db: 'connected',
      }
    });
  } catch (err) { next(err); }
});

router.get('/api-usage', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totals, byModel, recent, cacheStats] = await Promise.all([
      queryOne<Record<string, string>>('SELECT SUM(tokens_in) as total_in, SUM(tokens_out) as total_out, COUNT(*) as total_calls FROM api_usage_log'),
      query<Record<string, string>>('SELECT model, COUNT(*) as calls, SUM(tokens_in) as tokens_in, SUM(tokens_out) as tokens_out FROM api_usage_log GROUP BY model ORDER BY calls DESC'),
      query<Record<string, string>>('SELECT model, purpose, tokens_in, tokens_out, created_at FROM api_usage_log ORDER BY created_at DESC LIMIT 20'),
      queryOne<Record<string, string>>('SELECT COUNT(*) as total, SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as hits FROM api_usage_log'),
    ]);
    res.json({ success: true, data: { totals, byModel, recent, cacheStats } });
  } catch (err) { next(err); }
});

router.get('/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, progress] = await Promise.all([
      query('SELECT id, full_name, display_name, level, created_at FROM users ORDER BY created_at DESC'),
      query('SELECT user_id, COUNT(*) as chapters_done, AVG(best_score) as avg_score FROM user_progress GROUP BY user_id'),
    ]);
    res.json({ success: true, data: { users, progress } });
  } catch (err) { next(err); }
});

router.get('/cache', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [content, evaluation] = await Promise.all([
      query('SELECT class_level, subject, theme_slug, COUNT(*) as chapters_cached FROM content_cache GROUP BY class_level, subject, theme_slug ORDER BY class_level, subject'),
      query('SELECT class_level, subject, theme_slug, COUNT(*) as chapters_cached FROM evaluation_cache GROUP BY class_level, subject, theme_slug ORDER BY class_level, subject'),
    ]);
    res.json({ success: true, data: { contentCache: content, evaluationCache: evaluation } });
  } catch (err) { next(err); }
});

export default router;
