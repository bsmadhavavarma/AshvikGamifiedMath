import { Router, Response, NextFunction } from 'express';
import { contentService } from './content.service';
import { loadUser, AuthRequest } from '../auth/auth.middleware';

const router = Router();
router.use(loadUser);

// GET /api/content/:theme/:level/:subject/:chapter/teach
router.get('/:theme/:level/:subject/:chapter/teach', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { theme, level, subject, chapter } = req.params as Record<string, string>;
    const content = await contentService.getTeachingContent(
      theme, parseInt(level), decodeURIComponent(subject), parseInt(chapter), req.userId
    );
    res.json({ success: true, data: content });
  } catch (err) { next(err); }
});

// GET /api/content/:theme/:level/:subject/:chapter/evaluate
router.get('/:theme/:level/:subject/:chapter/evaluate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { theme, level, subject, chapter } = req.params as Record<string, string>;
    const evalSet = await contentService.getEvaluationSet(
      theme, parseInt(level), decodeURIComponent(subject), parseInt(chapter), req.userId
    );
    res.json({ success: true, data: evalSet });
  } catch (err) { next(err); }
});

export default router;
