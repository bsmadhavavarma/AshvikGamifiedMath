import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../../config/database';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const dbOk = await checkDatabaseConnection();
  const status = dbOk ? 'ok' : 'degraded';
  const httpStatus = dbOk ? 200 : 503;

  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    service: 'ashvik-gamified-math-backend',
    version: process.env['npm_package_version'] ?? '1.0.0',
    checks: {
      database: dbOk ? 'ok' : 'unreachable',
    },
  });
});

export default router;
