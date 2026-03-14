import { SessionsRepository } from './sessions.repository';
import { Session, CreateSessionDto } from './sessions.types';
import { QuestionsRepository } from '../questions/questions.repository';
import { PlayersRepository } from '../players/players.repository';
import { buildGeneratorKey, getGenerator } from '../questions/generators';
import { AppError } from '../../shared/types/errors.types';

export class SessionsService {
  constructor(
    private readonly sessionsRepo: SessionsRepository,
    private readonly questionsRepo: QuestionsRepository,
    private readonly playersRepo: PlayersRepository,
  ) {}

  async createSession(dto: CreateSessionDto): Promise<Session> {
    // Verify player exists
    const player = await this.playersRepo.findById(dto.playerId);
    if (player == null) {
      throw AppError.notFound('Player', dto.playerId);
    }

    // Check if a valid generator exists for the combination
    const generatorKey = buildGeneratorKey(dto.mathModule, dto.difficultyLevel);
    if (generatorKey == null) {
      throw AppError.badRequest(
        `No question generator found for module '${dto.mathModule}' and difficulty '${dto.difficultyLevel}'`,
      );
    }

    // Create the session
    const session = await this.sessionsRepo.create(dto);

    // Generate all 10 questions
    const generator = getGenerator(generatorKey);
    const questionRows: Array<{
      sessionId: string;
      mathModule: string;
      difficultyLevel: string;
      questionText: string;
      options: string[];
      correctOption: string;
      hintText: string | undefined;
      sequenceNumber: number;
    }> = [];

    for (let i = 1; i <= session.totalQuestions; i++) {
      const generated = generator.generate();
      questionRows.push({
        sessionId: session.id,
        mathModule: dto.mathModule,
        difficultyLevel: dto.difficultyLevel,
        questionText: generated.questionText,
        options: generated.options,
        correctOption: generated.correctOption,
        hintText: generated.hintText,
        sequenceNumber: i,
      });
    }

    await this.questionsRepo.saveMany(questionRows);

    return session;
  }

  async getSession(id: string): Promise<Session> {
    const session = await this.sessionsRepo.findById(id);
    if (session == null) {
      throw AppError.notFound('Session', id);
    }
    return session;
  }

  async abandonSession(id: string): Promise<Session> {
    const session = await this.sessionsRepo.findById(id);
    if (session == null) {
      throw AppError.notFound('Session', id);
    }
    if (session.status === 'completed') {
      throw new AppError('Session is already completed', 409, 'SESSION_ALREADY_COMPLETE');
    }
    if (session.status === 'abandoned') {
      throw new AppError('Session is already abandoned', 409, 'SESSION_ABANDONED');
    }
    return this.sessionsRepo.abandon(id);
  }
}
