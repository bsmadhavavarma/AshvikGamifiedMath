import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { usersService } from '../users/users.service';

const router = Router();

const loginSchema = z.object({
  displayName: z.string().min(1).max(100),
  pin: z.string().length(6).regex(/^\d{6}$/),
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName, pin } = loginSchema.parse(req.body);
    const user = await usersService.login(displayName, pin);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

export default router;
