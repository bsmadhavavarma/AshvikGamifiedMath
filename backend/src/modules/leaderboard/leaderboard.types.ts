export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  avatarCode: string;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalCorrect: number;
  totalAnswered: number;
  accuracyPct: number;
}

export interface LeaderboardRow {
  rank: string;
  player_id: string;
  display_name: string;
  avatar_code: string;
  total_coins: number;
  current_streak: number;
  longest_streak: number;
  total_sessions: string;
  total_correct: string;
  total_answered: string;
  accuracy_pct: string;
}

export function rowToLeaderboardEntry(row: LeaderboardRow): LeaderboardEntry {
  return {
    rank: parseInt(row.rank, 10),
    playerId: row.player_id,
    displayName: row.display_name,
    avatarCode: row.avatar_code,
    totalCoins: row.total_coins,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    totalSessions: parseInt(row.total_sessions, 10),
    totalCorrect: parseInt(row.total_correct, 10),
    totalAnswered: parseInt(row.total_answered, 10),
    accuracyPct: parseFloat(row.accuracy_pct),
  };
}
