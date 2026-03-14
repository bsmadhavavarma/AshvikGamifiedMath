import { QuestionsRepository } from './questions.repository';
import { SessionsRepository } from '../sessions/sessions.repository';
import { Question } from './questions.types';
import { AppError } from '../../shared/types/errors.types';

export class QuestionsService {
  constructor(
    private readonly questionsRepo: QuestionsRepository,
    private readonly sessionsRepo: SessionsRepository,
  ) {}

  async getQuestion(sessionId: string, sequenceNumber: number): Promise<Question> {
    const session = await this.sessionsRepo.findById(sessionId);
    if (session == null) {
      throw AppError.notFound('Session', sessionId);
    }

    if (sequenceNumber < 1 || sequenceNumber > session.totalQuestions) {
      throw AppError.badRequest(
        `Sequence number must be between 1 and ${session.totalQuestions}`,
      );
    }

    const question = await this.questionsRepo.findBySessionAndSequence(
      sessionId,
      sequenceNumber,
    );

    if (question == null) {
      throw AppError.notFound('Question', `session ${sessionId} sequence ${sequenceNumber}`);
    }

    // Strip the correct answer from the response (security: don't expose it)
    return question;
  }
}
