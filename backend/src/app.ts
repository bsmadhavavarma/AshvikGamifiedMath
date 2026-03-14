import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/error-handler';
import { logger } from './config/logger';

import healthRouter from './modules/health/health.router';
import playersRouter from './modules/players/players.router';
import sessionsRouter from './modules/sessions/sessions.router';
import questionsRouter from './modules/questions/questions.router';
import answersRouter from './modules/answers/answers.router';
import leaderboardRouter from './modules/leaderboard/leaderboard.router';

export function createApp(): Express {
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxies)
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // CORS
  app.use(corsMiddleware);

  // HTTP request logging
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res) => {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  // Global rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
      },
    },
  });
  app.use(limiter);

  // Stricter rate limit for answer submission (prevents brute-forcing)
  const answerLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Mount routers
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/players', playersRouter);
  app.use('/api/v1/sessions', sessionsRouter);

  // Questions nested under sessions
  app.use('/api/v1/sessions/:sessionId/questions', questionsRouter);

  // Answers nested under sessions (with stricter rate limit)
  app.use('/api/v1/sessions/:sessionId', answerLimiter, answersRouter);

  app.use('/api/v1/leaderboard', leaderboardRouter);

  // 404 handler
  app.use((_req: Request, res: Response): void => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler (must be last)
  app.use(
    (err: unknown, req: Request, res: Response, next: NextFunction): void => {
      errorHandler(err, req, res, next);
    },
  );

  return app;
}
