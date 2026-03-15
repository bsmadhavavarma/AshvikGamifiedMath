import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './shared/middleware/errorHandler';
import authRouter from './modules/auth/auth.router';
import adminRouter from './modules/admin/admin.router';
import ncertRouter from './modules/ncert/ncert.router';
import themesRouter from './modules/themes/themes.router';
import contentRouter from './modules/content/content.router';
import evaluationRouter from './modules/evaluation/evaluation.router';
import observabilityRouter from './modules/observability/observability.router';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.isProduction ? false : '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 200 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ncert', ncertRouter);
app.use('/api/themes', themesRouter);
app.use('/api/content', contentRouter);
app.use('/api/evaluation', evaluationRouter);
app.use('/api/observability', observabilityRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
