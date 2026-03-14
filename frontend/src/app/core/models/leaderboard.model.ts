export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  avatarCode: string;
  totalCoins: number;
  longestStreak: number;
  sessionsCompleted: number;
  rank: number;
  currentStreak: number;
  totalSessions: number;
  totalCorrect: number;
  totalAnswered: number;
  accuracyPct: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}
