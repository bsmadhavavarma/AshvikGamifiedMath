import { Pool } from 'pg';
import { Session, SessionRow, CreateSessionDto, rowToSession } from './sessions.types';

export class SessionsRepository {
  constructor(private readonly pool: Pool) {}

  async create(dto: CreateSessionDto): Promise<Session> {
    const result = await this.pool.query<SessionRow>(
      `INSERT INTO sessions (player_id, math_module, difficulty_level)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [dto.playerId, dto.mathModule, dto.difficultyLevel],
    );
    const row = result.rows[0];
    if (row == null) throw new Error('Failed to create session');
    return rowToSession(row);
  }

  async findById(id: string): Promise<Session | null> {
    const result = await this.pool.query<SessionRow>(
      'SELECT * FROM sessions WHERE id = $1',
      [id],
    );
    return result.rows[0] != null ? rowToSession(result.rows[0]) : null;
  }

  async updateProgress(
    id: string,
    questionsAnswered: number,
    correctCount: number,
    coinsEarned: number,
  ): Promise<Session> {
    const result = await this.pool.query<SessionRow>(
      `UPDATE sessions
       SET questions_answered = $2,
           correct_count      = $3,
           coins_earned       = $4
       WHERE id = $1
       RETURNING *`,
      [id, questionsAnswered, correctCount, coinsEarned],
    );
    const row = result.rows[0];
    if (row == null) throw new Error(`Session ${id} not found`);
    return rowToSession(row);
  }

  async complete(id: string, timeTakenSecs: number): Promise<Session> {
    const result = await this.pool.query<SessionRow>(
      `UPDATE sessions
       SET status        = 'completed',
           completed_at  = now(),
           time_taken_secs = $2
       WHERE id = $1
       RETURNING *`,
      [id, timeTakenSecs],
    );
    const row = result.rows[0];
    if (row == null) throw new Error(`Session ${id} not found`);
    return rowToSession(row);
  }

  async abandon(id: string): Promise<Session> {
    const result = await this.pool.query<SessionRow>(
      `UPDATE sessions
       SET status       = 'abandoned',
           completed_at = now()
       WHERE id = $1 AND status = 'active'
       RETURNING *`,
      [id],
    );
    const row = result.rows[0];
    if (row == null) throw new Error(`Session ${id} not found or already completed/abandoned`);
    return rowToSession(row);
  }
}
