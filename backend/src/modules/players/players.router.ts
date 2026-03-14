import { Router } from 'express';
import { pool } from '../../config/database';
import { PlayersRepository } from './players.repository';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';

const router = Router();

const playersRepo = new PlayersRepository(pool);
const playersService = new PlayersService(playersRepo);
const playersController = new PlayersController(playersService);

router.post('/', playersController.createPlayer);
router.get('/:id', playersController.getPlayer);
router.get('/:id/stats', playersController.getPlayerStats);
router.get('/:id/history', playersController.getPlayerHistory);

export { playersRepo, playersService };
export default router;
