import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { pool } from './config/database';
import { runMigrations } from './db/migrate';

async function main(): Promise<void> {
  logger.info('Starting AshvikGamifiedMath backend...');

  // Run database migrations before accepting traffic
  try {
    await runMigrations();
    logger.info('Database migrations completed');
  } catch (err) {
    logger.error({ err }, 'Failed to run database migrations. Aborting startup.');
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, nodeEnv: env.NODE_ENV },
      `AshvikGamifiedMath server listening`,
    );
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal, gracefully closing...');
    server.close(async () => {
      try {
        await pool.end();
        logger.info('Database pool closed');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error closing database pool');
        process.exit(1);
      }
    });

    // Force close after 10s
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });
}

void main();
