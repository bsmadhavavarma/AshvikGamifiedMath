import { Request, Response } from 'express';
import { LeaderboardService } from './leaderboard.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { createApiResponse } from '../../shared/types/api-response.types';

export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  getLeaderboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = Math.min(
      500,
      Math.max(1, parseInt(String(req.query['limit'] ?? '100'), 10)),
    );
    const entries = await this.leaderboardService.getLeaderboard(limit);
    res.json(createApiResponse(entries));
  });

  getPlayerRank = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { playerId } = req.params as { playerId: string };
    const context = await this.leaderboardService.getPlayerRank(playerId);
    res.json(createApiResponse(context));
  });
}
