import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const pool = new Pool({ connectionString: env.DATABASE_URL });

pool.on('error', (err) => logger.error({ err }, 'PostgreSQL pool error'));

export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
