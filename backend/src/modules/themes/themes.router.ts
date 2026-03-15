import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../db/client';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const themes = await query('SELECT id, name, slug, description FROM themes WHERE is_active = true ORDER BY name');
    res.json({ success: true, data: { themes } });
  } catch (err) { next(err); }
});

export default router;
