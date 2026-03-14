export type MathModule = 'percentages';
export type DifficultyLevel = 'class5' | 'class6';
export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface Session {
  id: string;
  playerId: string;
  mathModule: MathModule;
  difficultyLevel: DifficultyLevel;
  status: SessionStatus;
  totalQuestions: number;
  questionsAnswered: number;
  correctCount: number;
  coinsEarned: number;
  timeTakenSecs: number | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface CreateSessionDto {
  playerId: string;
  mathModule: MathModule;
  difficultyLevel: DifficultyLevel;
}

export interface SessionRow {
  id: string;
  player_id: string;
  math_module: MathModule;
  difficulty_level: DifficultyLevel;
  status: SessionStatus;
  total_questions: number;
  questions_answered: number;
  correct_count: number;
  coins_earned: number;
  time_taken_secs: number | null;
  started_at: Date;
  completed_at: Date | null;
}

export function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    playerId: row.player_id,
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
  };
}
