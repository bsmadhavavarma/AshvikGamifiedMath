import { Router, Request, Response, NextFunction } from 'express';
import { ncertService } from './ncert.service';
import { loadUser, AuthRequest } from '../auth/auth.middleware';

const router = Router();

// GET /api/ncert/levels/:level/subjects
router.get('/levels/:level/subjects', loadUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const level = parseInt(req.params['level']!, 10);
    if (isNaN(level) || level < 1 || level > 12) {
      res.status(400).json({ success: false, error: { message: 'Invalid level' } });
      return;
    }
    const subjects = ncertService.getSubjectsForLevel(level);
    res.json({ success: true, data: { subjects: subjects.map(s => ({ name: s.name, chapterCount: s.chapters.length })) } });
  } catch (err) { next(err); }
});

// GET /api/ncert/levels/:level/subjects/:subject/chapters
router.get('/levels/:level/subjects/:subject/chapters', loadUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const level = parseInt(req.params['level']!, 10);
    const subject = decodeURIComponent(req.params['subject']!);
    const subjectData = ncertService.getSubject(level, subject);
    if (!subjectData) {
      res.status(404).json({ success: false, error: { message: 'Subject not found' } });
      return;
    }
    res.json({ success: true, data: { chapters: subjectData.chapters.map(c => ({ index: c.index, title: c.title, hasMarkdown: !!c.markdownPath })) } });
  } catch (err) { next(err); }
});

export default router;
