import { LeaderboardRepository } from './leaderboard.repository';
import { LeaderboardEntry } from './leaderboard.types';
import { AppError } from '../../shared/types/errors.types';

export interface PlayerRankContext {
  playerEntry: LeaderboardEntry;
  above: LeaderboardEntry[];
  below: LeaderboardEntry[];
}

export class LeaderboardService {
  constructor(private readonly leaderboardRepo: LeaderboardRepository) {}

  async getLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
    const clampedLimit = Math.min(500, Math.max(1, limit));
    return this.leaderboardRepo.getTopN(clampedLimit);
  }

  async getPlayerRank(playerId: string): Promise<PlayerRankContext> {
    const context = await this.leaderboardRepo.getPlayerRankContext(playerId, 2);
    if (context.playerEntry == null) {
      throw AppError.notFound('Player in leaderboard', playerId);
    }
    return context as PlayerRankContext;
  }
}
