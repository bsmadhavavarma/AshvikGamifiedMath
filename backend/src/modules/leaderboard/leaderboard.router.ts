import { Router } from 'express';
import { pool } from '../../config/database';
import { LeaderboardRepository } from './leaderboard.repository';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';

const router = Router();

const leaderboardRepo = new LeaderboardRepository(pool);
const leaderboardService = new LeaderboardService(leaderboardRepo);
const leaderboardController = new LeaderboardController(leaderboardService);

router.get('/', leaderboardController.getLeaderboard);
router.get('/me/:playerId', leaderboardController.getPlayerRank);

export default router;
