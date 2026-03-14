import { Pool } from 'pg';
import { Player, PlayerRow, PlayerStats, PlayerHistoryEntry, rowToPlayer } from './players.types';

export class PlayersRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Player | null> {
    const result = await this.pool.query<PlayerRow>(
      'SELECT * FROM players WHERE id = $1',
      [id],
    );
    return result.rows[0] != null ? rowToPlayer(result.rows[0]) : null;
  }

  async findByName(displayName: string): Promise<Player | null> {
    const result = await this.pool.query<PlayerRow>(
      'SELECT * FROM players WHERE display_name = $1',
      [displayName],
    );
    return result.rows[0] != null ? rowToPlayer(result.rows[0]) : null;
  }

  async create(displayName: string, avatarCode = 'default'): Promise<Player> {
    const result = await this.pool.query<PlayerRow>(
      `INSERT INTO players (display_name, avatar_code)
       VALUES ($1, $2)
       RETURNING *`,
      [displayName, avatarCode],
    );
    const row = result.rows[0];
    if (row == null) throw new Error('Failed to create player');
    return rowToPlayer(row);
  }

  async updateCoins(id: string, coinsToAdd: number): Promise<Player> {
    const result = await this.pool.query<PlayerRow>(
      `UPDATE players
       SET total_coins = total_coins + $2
       WHERE id = $1
       RETURNING *`,
      [id, coinsToAdd],
    );
    const row = result.rows[0];
    if (row == null) throw new Error(`Player ${id} not found for coin update`);
    return rowToPlayer(row);
  }

  async updateStreak(
    id: string,
    currentStreak: number,
    longestStreak: number,
  ): Promise<Player> {
    const result = await this.pool.query<PlayerRow>(
      `UPDATE players
       SET current_streak = $2,
           longest_streak = $3
       WHERE id = $1
       RETURNING *`,
      [id, currentStreak, longestStreak],
    );
    const row = result.rows[0];
    if (row == null) throw new Error(`Player ${id} not found for streak update`);
    return rowToPlayer(row);
  }

  async getStats(id: string): Promise<PlayerStats | null> {
    const result = await this.pool.query<{
      player_id: string;
      display_name: string;
      avatar_code: string;
      total_coins: number;
      current_streak: number;
      longest_streak: number;
      total_sessions: string;
      completed_sessions: string;
      total_questions_answered: string;
      total_correct: string;
      created_at: Date;
    }>(
      `SELECT
         p.id                                             AS player_id,
         p.display_name,
         p.avatar_code,
         p.total_coins,
         p.current_streak,
         p.longest_streak,
         COUNT(DISTINCT s.id)                            AS total_sessions,
         COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
         COALESCE(SUM(s.questions_answered), 0)          AS total_questions_answered,
         COALESCE(SUM(s.correct_count), 0)               AS total_correct,
         p.created_at
       FROM players p
       LEFT JOIN sessions s ON s.player_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, p.display_name, p.avatar_code, p.total_coins,
                p.current_streak, p.longest_streak, p.created_at`,
      [id],
    );

    const row = result.rows[0];
    if (row == null) return null;

    const totalAnswered = parseInt(row.total_questions_answered, 10);
    const totalCorrect = parseInt(row.total_correct, 10);
    const accuracyPct =
      totalAnswered === 0 ? 0 : Math.round((totalCorrect / totalAnswered) * 100 * 100) / 100;

    return {
      playerId: row.player_id,
      displayName: row.display_name,
      avatarCode: row.avatar_code,
      totalCoins: row.total_coins,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      totalSessions: parseInt(row.total_sessions, 10),
      completedSessions: parseInt(row.completed_sessions, 10),
      totalQuestionsAnswered: totalAnswered,
      totalCorrect,
      accuracyPct,
      createdAt: row.created_at,
    };
  }

  async getHistory(id: string, limit = 20, offset = 0): Promise<PlayerHistoryEntry[]> {
    const result = await this.pool.query<{
      session_id: string;
      math_module: string;
      difficulty_level: string;
      status: string;
      total_questions: number;
      questions_answered: number;
      correct_count: number;
      coins_earned: number;
      time_taken_secs: number | null;
      started_at: Date;
      completed_at: Date | null;
    }>(
      `SELECT
         s.id AS session_id,
         s.math_module,
         s.difficulty_level,
         s.status,
         s.total_questions,
         s.questions_answered,
         s.correct_count,
         s.coins_earned,
         s.time_taken_secs,
         s.started_at,
         s.completed_at
       FROM sessions s
       WHERE s.player_id = $1
       ORDER BY s.started_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset],
    );

    return result.rows.map((row) => ({
      sessionId: row.session_id,
      mathModule: row.math_module,
      difficultyLevel: row.difficulty_level,
      status: row.status,
      totalQuestions: row.total_questions,
      questionsAnswered: row.questions_answered,
      correctCount: row.correct_count,
      coinsEarned: row.coins_earned,
      timeTakenSecs: row.time_taken_secs,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    }));
  }
}
