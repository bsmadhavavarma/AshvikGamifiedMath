import { Router } from 'express';
import { pool } from '../../config/database';
import { AnswersRepository } from './answers.repository';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';
import { SessionsRepository } from '../sessions/sessions.repository';
import { QuestionsRepository } from '../questions/questions.repository';
import { PlayersRepository } from '../players/players.repository';

// Router is mounted under /sessions/:sessionId
const router = Router({ mergeParams: true });

const answersRepo = new AnswersRepository(pool);
const sessionsRepo = new SessionsRepository(pool);
const questionsRepo = new QuestionsRepository(pool);
const playersRepo = new PlayersRepository(pool);
const answersService = new AnswersService(answersRepo, sessionsRepo, questionsRepo, playersRepo, pool);
const answersController = new AnswersController(answersService);

router.post('/questions/:questionId/answer', answersController.submitAnswer);

export { answersRepo, answersService };
export default router;
