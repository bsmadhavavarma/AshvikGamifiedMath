export interface Player {
  id: string;
  displayName: string;
  avatarCode: string;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
}

export interface PlayerStats {
  sessionsCompleted: number;
  totalCorrect: number;
  averageAccuracy: number;
}

export interface PlayerHistoryEntry {
  sessionId: string;
  mathModule: string;
  difficultyLevel: string;
  status: string;
  totalQuestions: number;
  questionsAnswered: number;
  correctCount: number;
  coinsEarned: number;
  timeTakenSecs: number | null;
  startedAt: string;
  completedAt: string | null;
}

export interface CreatePlayerDto {
  displayName: string;
  avatarCode?: string;
}
