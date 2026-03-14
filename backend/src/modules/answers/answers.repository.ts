import { Pool } from 'pg';
import { Answer, AnswerRow, rowToAnswer } from './answers.types';

export class AnswersRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: {
    sessionId: string;
    questionId: string;
    playerId: string;
    chosenOption: string | null;
    isCorrect: boolean;
    timeTakenMs: number;
    coinsAwarded: number;
  }): Promise<Answer> {
    const result = await this.pool.query<AnswerRow>(
      `INSERT INTO answers
         (session_id, question_id, player_id, chosen_option, is_correct, time_taken_ms, coins_awarded)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.sessionId,
        data.questionId,
        data.playerId,
        data.chosenOption,
        data.isCorrect,
        data.timeTakenMs,
        data.coinsAwarded,
      ],
    );
    const row = result.rows[0];
    if (row == null) throw new Error('Failed to create answer');
    return rowToAnswer(row);
  }

  async findBySession(sessionId: string): Promise<Answer[]> {
    const result = await this.pool.query<AnswerRow>(
      `SELECT * FROM answers
       WHERE session_id = $1
       ORDER BY answered_at ASC`,
      [sessionId],
    );
    return result.rows.map(rowToAnswer);
  }

  async findBySessionAndQuestion(sessionId: string, questionId: string): Promise<Answer | null> {
    const result = await this.pool.query<AnswerRow>(
      `SELECT * FROM answers
       WHERE session_id = $1 AND question_id = $2`,
      [sessionId, questionId],
    );
    return result.rows[0] != null ? rowToAnswer(result.rows[0]) : null;
  }
}
