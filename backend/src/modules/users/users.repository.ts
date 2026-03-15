import { query, queryOne } from '../../db/client';
import { UserRow } from './users.types';

export const usersRepository = {
  async findByDisplayName(displayName: string): Promise<UserRow | null> {
    return queryOne<UserRow>(
      'SELECT * FROM users WHERE LOWER(display_name) = LOWER($1)',
      [displayName]
    );
  },

  async findById(id: string): Promise<UserRow | null> {
    return queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  },

  async findAll(): Promise<UserRow[]> {
    return query<UserRow>('SELECT * FROM users ORDER BY created_at DESC');
  },

  async create(fullName: string, displayName: string, level: number, pinHash: string, pin: string): Promise<UserRow> {
    const rows = await query<UserRow>(
      `INSERT INTO users (full_name, display_name, level, pin_hash, pin)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [fullName, displayName, level, pinHash, pin]
    );
    return rows[0]!;
  },

  async updateLevel(id: string, level: number): Promise<UserRow | null> {
    return queryOne<UserRow>(
      `UPDATE users SET level = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [level, id]
    );
  },

  async updatePin(id: string, pinHash: string): Promise<void> {
    await query('UPDATE users SET pin_hash = $1, updated_at = NOW() WHERE id = $2', [pinHash, id]);
  },

  async adminUpdate(id: string, fields: { fullName?: string; displayName?: string; level?: number; pinHash?: string; pin?: string }): Promise<UserRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (fields.fullName !== undefined) { sets.push(`full_name = $${idx++}`); values.push(fields.fullName); }
    if (fields.displayName !== undefined) { sets.push(`display_name = $${idx++}`); values.push(fields.displayName); }
    if (fields.level !== undefined) { sets.push(`level = $${idx++}`); values.push(fields.level); }
    if (fields.pinHash !== undefined) { sets.push(`pin_hash = $${idx++}`); values.push(fields.pinHash); }
    if (fields.pin !== undefined) { sets.push(`pin = $${idx++}`); values.push(fields.pin); }
    if (sets.length === 0) return this.findById(id);
    sets.push(`updated_at = NOW()`);
    values.push(id);
    return queryOne<UserRow>(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  },

  async delete(id: string): Promise<void> {
    await query('DELETE FROM users WHERE id = $1', [id]);
  },

  async clearUserData(userId: string, classLevel?: number, subject?: string): Promise<void> {
    if (classLevel !== undefined && subject) {
      // Clear specific level+subject sessions (cascades to attempts)
      await query(
        `DELETE FROM learning_sessions WHERE user_id=$1 AND class_level=$2 AND subject=$3`,
        [userId, classLevel, subject]
      );
      await query(
        `DELETE FROM user_progress WHERE user_id=$1 AND class_level=$2 AND subject=$3`,
        [userId, classLevel, subject]
      );
    } else {
      // Clear all user data (keep user account)
      await query(`DELETE FROM learning_sessions WHERE user_id=$1`, [userId]);
      await query(`DELETE FROM user_progress WHERE user_id=$1`, [userId]);
    }
  },
};
