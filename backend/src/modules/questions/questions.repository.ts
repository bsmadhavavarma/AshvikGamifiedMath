import { Pool } from 'pg';
import { Question, QuestionRow, rowToQuestion } from './questions.types';

interface SaveQuestionData {
  sessionId: string;
  mathModule: string;
  difficultyLevel: string;
  questionText: string;
  options: string[];
  correctOption: string;
  hintText?: string;
  sequenceNumber: number;
}

export class QuestionsRepository {
  constructor(private readonly pool: Pool) {}

  async saveMany(questions: SaveQuestionData[]): Promise<Question[]> {
    if (questions.length === 0) return [];

    // Build a parameterized bulk insert
    const valuesClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const q of questions) {
      valuesClauses.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}::jsonb, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`,
      );
      params.push(
        q.sessionId,
        q.mathModule,
        q.difficultyLevel,
        q.questionText,
        JSON.stringify(q.options),
        q.correctOption,
        q.hintText ?? null,
        q.sequenceNumber,
      );
    }

    const sql = `
      INSERT INTO questions
        (session_id, math_module, difficulty_level, question_text, options, correct_option, hint_text, sequence_number)
      VALUES
        ${valuesClauses.join(', ')}
      RETURNING *
    `;

    const result = await this.pool.query<QuestionRow>(sql, params);
    return result.rows.map(rowToQuestion);
  }

  async findBySessionAndSequence(
    sessionId: string,
    sequenceNumber: number,
  ): Promise<Question | null> {
    const result = await this.pool.query<QuestionRow>(
      `SELECT * FROM questions
       WHERE session_id = $1 AND sequence_number = $2`,
      [sessionId, sequenceNumber],
    );
    return result.rows[0] != null ? rowToQuestion(result.rows[0]) : null;
  }

  async findBySession(sessionId: string): Promise<Question[]> {
    const result = await this.pool.query<QuestionRow>(
      `SELECT * FROM questions
       WHERE session_id = $1
       ORDER BY sequence_number ASC`,
      [sessionId],
    );
    return result.rows.map(rowToQuestion);
  }

  async findById(id: string): Promise<Question | null> {
    const result = await this.pool.query<QuestionRow>(
      'SELECT * FROM questions WHERE id = $1',
      [id],
    );
    return result.rows[0] != null ? rowToQuestion(result.rows[0]) : null;
  }
}
