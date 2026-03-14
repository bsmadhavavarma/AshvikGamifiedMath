import { Router } from 'express';
import { pool } from '../../config/database';
import { SessionsRepository } from './sessions.repository';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { QuestionsRepository } from '../questions/questions.repository';
import { PlayersRepository } from '../players/players.repository';

const router = Router();

const sessionsRepo = new SessionsRepository(pool);
const questionsRepo = new QuestionsRepository(pool);
const playersRepo = new PlayersRepository(pool);
const sessionsService = new SessionsService(sessionsRepo, questionsRepo, playersRepo);
const sessionsController = new SessionsController(sessionsService);

router.post('/', sessionsController.createSession);
router.get('/:id', sessionsController.getSession);
router.patch('/:id/abandon', sessionsController.abandonSession);

export { sessionsRepo, sessionsService };
export default router;
