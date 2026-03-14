import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { pool, query } from '../config/database';
import { logger } from '../config/logger';

// SQL files live in src/db/migrations and are not copied by tsc.
// When running compiled JS from dist/, navigate back to src/db/migrations.
const MIGRATIONS_DIR = __dirname.includes('/dist/')
  ? path.resolve(__dirname, '../../src/db/migrations')
  : path.join(__dirname, 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY filename ASC',
  );
  return new Set(result.rows.map((row) => row.filename));
}

async function applyMigration(filename: string, sql: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    logger.info({ filename }, 'Applied migration');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err, filename }, 'Migration failed, rolled back');
    throw err;
  } finally {
    client.release();
  }
}

export async function runMigrations(): Promise<void> {
  logger.info('Starting database migrations');

  await ensureMigrationsTable();
  const appliedMigrations = await getAppliedMigrations();

  let files: string[];
  try {
    const allFiles = await readdir(MIGRATIONS_DIR);
    files = allFiles
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));
  } catch (err) {
    logger.error({ err }, 'Failed to read migrations directory');
    throw err;
  }

  const pendingMigrations = files.filter((f) => !appliedMigrations.has(f));

  if (pendingMigrations.length === 0) {
    logger.info('No pending migrations');
    return;
  }

  logger.info({ count: pendingMigrations.length }, 'Found pending migrations');

  for (const filename of pendingMigrations) {
    const filepath = path.join(MIGRATIONS_DIR, filename);
    const sql = await readFile(filepath, 'utf-8');
    await applyMigration(filename, sql);
  }

  logger.info('All migrations applied successfully');
}

// Allow running directly: ts-node src/db/migrate.ts
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration runner finished');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Migration runner failed');
      process.exit(1);
    });
}
