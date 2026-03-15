import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { pool } from './db/client';

const server = app.listen(env.PORT, () => {
  logger.info(`AITeacherEvaluator backend running on port ${env.PORT}`);
});

async function shutdown() {
  logger.info('Shutting down...');
  server.close(async () => {
    await pool.end();
    logger.info('Server stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
