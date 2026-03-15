import fs from 'fs';
import path from 'path';
import { pool } from './client';
import { logger } from '../config/logger';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const { rows } = await client.query('SELECT id FROM migrations WHERE filename = $1', [file]);
      if (rows.length > 0) {
        logger.debug(`Skipping already-run migration: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      logger.info(`Running migration: ${file}`);
      await client.query(sql);
      await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
      logger.info(`Completed: ${file}`);
    }
    logger.info('All migrations complete');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => { logger.error(err); process.exit(1); });
