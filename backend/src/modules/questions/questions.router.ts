import { Router } from 'express';
import { pool } from '../../config/database';
import { QuestionsRepository } from './questions.repository';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { SessionsRepository } from '../sessions/sessions.repository';

// Router is mounted under /sessions/:sessionId
const router = Router({ mergeParams: true });

const questionsRepo = new QuestionsRepository(pool);
const sessionsRepo = new SessionsRepository(pool);
const questionsService = new QuestionsService(questionsRepo, sessionsRepo);
const questionsController = new QuestionsController(questionsService);

router.get('/:sequenceNumber', questionsController.getQuestion);

export { questionsRepo, questionsService };
export default router;
