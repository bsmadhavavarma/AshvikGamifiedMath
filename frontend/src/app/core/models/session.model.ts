export type MathModule = 'percentages';
export type DifficultyLevel = 'class5' | 'class6';

export interface Session {
  id: string;
  playerId: string;
  mathModule: MathModule;
  difficultyLevel: DifficultyLevel;
  status: 'active' | 'completed' | 'abandoned';
  totalQuestions: number;
  questionsAnswered: number;
  correctCount: number;
  coinsEarned: number;
  startedAt: string;
  completedAt?: string;
}

export interface CreateSessionDto {
  playerId: string;
  mathModule: MathModule;
  difficultyLevel: DifficultyLevel;
}
