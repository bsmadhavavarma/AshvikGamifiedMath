export interface Player {
  id: string;
  displayName: string;
  avatarCode: string;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlayerDto {
  displayName: string;
  avatarCode?: string;
}

export interface PlayerStats {
  playerId: string;
  displayName: string;
  avatarCode: string;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  completedSessions: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  accuracyPct: number;
  createdAt: Date;
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
  startedAt: Date;
  completedAt: Date | null;
}

// DB row shape (snake_case)
export interface PlayerRow {
  id: string;
  display_name: string;
  avatar_code: string;
  total_coins: number;
  current_streak: number;
  longest_streak: number;
  created_at: Date;
  updated_at: Date;
}

export function rowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarCode: row.avatar_code,
    totalCoins: row.total_coins,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
