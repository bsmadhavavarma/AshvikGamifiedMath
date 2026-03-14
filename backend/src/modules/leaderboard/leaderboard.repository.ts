import { Pool } from 'pg';
import { LeaderboardEntry, LeaderboardRow, rowToLeaderboardEntry } from './leaderboard.types';

export class LeaderboardRepository {
  constructor(private readonly pool: Pool) {}

  async getTopN(n: number): Promise<LeaderboardEntry[]> {
    const result = await this.pool.query<LeaderboardRow>(
      `SELECT
         rank::text,
         player_id,
         display_name,
         avatar_code,
         total_coins,
         current_streak,
         longest_streak,
         total_sessions::text,
         total_correct::text,
         total_answered::text,
         accuracy_pct::text
       FROM leaderboard
       ORDER BY rank ASC
       LIMIT $1`,
      [n],
    );
    return result.rows.map(rowToLeaderboardEntry);
  }

  async getPlayerRankContext(
    playerId: string,
    contextSize = 2,
  ): Promise<{
    playerEntry: LeaderboardEntry | null;
    above: LeaderboardEntry[];
    below: LeaderboardEntry[];
  }> {
    // Get the player's own entry first
    const playerResult = await this.pool.query<LeaderboardRow>(
      `SELECT
         rank::text,
         player_id,
         display_name,
         avatar_code,
         total_coins,
         current_streak,
         longest_streak,
         total_sessions::text,
         total_correct::text,
         total_answered::text,
         accuracy_pct::text
       FROM leaderboard
       WHERE player_id = $1`,
      [playerId],
    );

    const playerRow = playerResult.rows[0];
    if (playerRow == null) {
      return { playerEntry: null, above: [], below: [] };
    }

    const playerEntry = rowToLeaderboardEntry(playerRow);
    const playerRank = playerEntry.rank;

    // Get players above
    const aboveResult = await this.pool.query<LeaderboardRow>(
      `SELECT
         rank::text,
         player_id,
         display_name,
         avatar_code,
         total_coins,
         current_streak,
         longest_streak,
         total_sessions::text,
         total_correct::text,
         total_answered::text,
         accuracy_pct::text
       FROM leaderboard
       WHERE rank < $1
       ORDER BY rank DESC
       LIMIT $2`,
      [playerRank, contextSize],
    );

    // Get players below
    const belowResult = await this.pool.query<LeaderboardRow>(
      `SELECT
         rank::text,
         player_id,
         display_name,
         avatar_code,
         total_coins,
         current_streak,
         longest_streak,
         total_sessions::text,
         total_correct::text,
         total_answered::text,
         accuracy_pct::text
       FROM leaderboard
       WHERE rank > $1
       ORDER BY rank ASC
       LIMIT $2`,
      [playerRank, contextSize],
    );

    return {
      playerEntry,
      above: aboveResult.rows.map(rowToLeaderboardEntry).reverse(),
      below: belowResult.rows.map(rowToLeaderboardEntry),
    };
  }
}
