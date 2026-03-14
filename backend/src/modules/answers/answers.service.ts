import { Pool } from 'pg';
import { AnswersRepository } from './answers.repository';
import { SessionsRepository } from '../sessions/sessions.repository';
import { QuestionsRepository } from '../questions/questions.repository';
import { PlayersRepository } from '../players/players.repository';
import { SubmitAnswerDto, AnswerFeedback } from './answers.types';
import { AppError } from '../../shared/types/errors.types';
import { logger } from '../../config/logger';

export class AnswersService {
  constructor(
    private readonly answersRepo: AnswersRepository,
    private readonly sessionsRepo: SessionsRepository,
    private readonly questionsRepo: QuestionsRepository,
    private readonly playersRepo: PlayersRepository,
    private readonly pool: Pool,
  ) {}

  /**
   * Coin scoring logic:
   *   base_coins  = difficulty == 'class6' ? 15 : 10
   *   speed_bonus = timeTakenMs < 5000 ? 5 : timeTakenMs < 10000 ? 2 : 0
   *   streak_bonus = streak >= 5 ? 3 : streak >= 3 ? 1 : 0
   *   total = (base + speed + streak) if correct, else 0
   */
  private calculateCoins(
    difficultyLevel: string,
    timeTakenMs: number,
    currentStreak: number,
    isCorrect: boolean,
  ): number {
    if (!isCorrect) return 0;

    const baseCoins = difficultyLevel === 'class6' ? 15 : 10;
    const speedBonus = timeTakenMs < 5000 ? 5 : timeTakenMs < 10000 ? 2 : 0;
    const streakBonus = currentStreak >= 5 ? 3 : currentStreak >= 3 ? 1 : 0;

    return baseCoins + speedBonus + streakBonus;
  }

  private buildExplanation(
    isCorrect: boolean,
    correctOption: string,
    chosenOption: string | null,
    coinsAwarded: number,
  ): string {
    if (isCorrect) {
      return `Correct! The answer is ${correctOption}. You earned ${coinsAwarded} coins.`;
    }
    const chosen = chosenOption ?? '(skipped)';
    return `Incorrect. You chose ${chosen}, but the correct answer is ${correctOption}. Keep practising!`;
  }

  async submitAnswer(
    sessionId: string,
    questionId: string,
    dto: SubmitAnswerDto,
  ): Promise<AnswerFeedback> {
    // Load session
    const session = await this.sessionsRepo.findById(sessionId);
    if (session == null) throw AppError.notFound('Session', sessionId);

    if (session.status === 'completed') {
      throw new AppError('Session is already completed', 409, 'SESSION_ALREADY_COMPLETE');
    }
    if (session.status === 'abandoned') {
      throw new AppError('Session has been abandoned', 409, 'SESSION_ABANDONED');
    }

    // Load question
    const question = await this.questionsRepo.findById(questionId);
    if (question == null) throw AppError.notFound('Question', questionId);

    if (question.sessionId !== sessionId) {
      throw AppError.badRequest('Question does not belong to this session');
    }

    // Check if already answered
    const existing = await this.answersRepo.findBySessionAndQuestion(sessionId, questionId);
    if (existing != null) {
      throw new AppError('Question has already been answered', 409, 'QUESTION_ALREADY_ANSWERED');
    }

    // Load player
    const player = await this.playersRepo.findById(session.playerId);
    if (player == null) throw AppError.notFound('Player', session.playerId);

    // Determine correctness
    const isCorrect =
      dto.chosenOption != null && dto.chosenOption === question.correctOption;

    // Calculate streak (before awarding coins, streak bonus uses CURRENT streak)
    const newStreak = isCorrect ? player.currentStreak + 1 : 0;
    const longestStreak = Math.max(player.longestStreak, newStreak);

    // Calculate coins (streak bonus based on new streak from this answer)
    const coinsAwarded = this.calculateCoins(
      session.difficultyLevel,
      dto.timeTakenMs,
      newStreak,
      isCorrect,
    );

    // Persist in a transaction
    const client = await this.pool.connect();
    let feedback: AnswerFeedback;
    try {
      await client.query('BEGIN');

      // 1. Save answer
      const answer = await this.answersRepo.create({
        sessionId,
        questionId,
        playerId: session.playerId,
        chosenOption: dto.chosenOption,
        isCorrect,
        timeTakenMs: dto.timeTakenMs,
        coinsAwarded,
      });

      // 2. Update session progress
      const newAnswered = session.questionsAnswered + 1;
      const newCorrect = session.correctCount + (isCorrect ? 1 : 0);
      const newSessionCoins = session.coinsEarned + coinsAwarded;

      let updatedSession = await this.sessionsRepo.updateProgress(
        sessionId,
        newAnswered,
        newCorrect,
        newSessionCoins,
      );

      // 3. Complete session if all questions answered
      const isSessionComplete = newAnswered >= session.totalQuestions;
      if (isSessionComplete) {
        const startMs = session.startedAt.getTime();
        const timeTakenSecs = Math.round((Date.now() - startMs) / 1000);
        updatedSession = await this.sessionsRepo.complete(sessionId, timeTakenSecs);
      }

      // 4. Update player coins and streak
      await this.playersRepo.updateCoins(session.playerId, coinsAwarded);
      const updatedPlayer = await this.playersRepo.updateStreak(
        session.playerId,
        newStreak,
        longestStreak,
      );

      await client.query('COMMIT');

      // 5. Refresh materialized view asynchronously if session complete
      if (isSessionComplete) {
        this.pool
          .query('REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard')
          .catch((err: unknown) => {
            logger.error({ err }, 'Failed to refresh leaderboard materialized view');
          });
      }

      feedback = {
        answerId: answer.id,
        isCorrect,
        correctOption: question.correctOption,
        chosenOption: dto.chosenOption,
        coinsAwarded,
        currentStreak: updatedPlayer.currentStreak,
        totalCoins: updatedPlayer.totalCoins,
        explanation: this.buildExplanation(
          isCorrect,
          question.correctOption,
          dto.chosenOption,
          coinsAwarded,
        ),
        sessionProgress: {
          questionsAnswered: updatedSession.questionsAnswered,
          totalQuestions: updatedSession.totalQuestions,
          correctCount: updatedSession.correctCount,
          coinsEarned: updatedSession.coinsEarned,
          isComplete: isSessionComplete,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return feedback;
  }
}
