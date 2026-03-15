import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { evaluationService } from './evaluation.service';
import { loadUser, AuthRequest } from '../auth/auth.middleware';

const router = Router();
router.use(loadUser);

const startSchema = z.object({
  themeSlug: z.string(),
  classLevel: z.number().int().min(1).max(12),
  subject: z.string(),
  chapterIndex: z.number().int().min(0),
});

const answerSchema = z.object({
  sessionId: z.string().uuid(),
  questionIndex: z.number().int().min(0),
  questionType: z.enum(['mcq', 'short_answer', 'long_answer', 'diagram_description']),
  questionText: z.string(),
  userAnswer: z.string().min(1),
  sampleAnswer: z.string().optional(),
  themeSlug: z.string(),
});

// POST /api/evaluation/sessions
router.post('/sessions', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dto = startSchema.parse(req.body);
    const sessionId = await evaluationService.createSession(
      req.userId!, dto.themeSlug, dto.classLevel, dto.subject, dto.chapterIndex
    );
    res.status(201).json({ success: true, data: { sessionId } });
  } catch (err) { next(err); }
});

// POST /api/evaluation/sessions/:id/start
router.post('/sessions/:id/start', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await evaluationService.startEvaluation(req.params['id']!, req.userId!);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/evaluation/answers
router.post('/answers', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dto = answerSchema.parse(req.body);
    const result = await evaluationService.submitAnswer({ ...dto, userId: req.userId! });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/evaluation/sessions/:id/decision
router.get('/sessions/:id/decision', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const decision = await evaluationService.decideNextAction(req.params['id']!, req.userId!);
    res.json({ success: true, data: decision });
  } catch (err) { next(err); }
});

// GET /api/evaluation/progress
router.get('/progress', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const progress = await evaluationService.getProgress(req.userId!);
    res.json({ success: true, data: { progress } });
  } catch (err) { next(err); }
});

export default router;
