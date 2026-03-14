import { AnswersService } from '../../../../src/modules/answers/answers.service';
import { AnswersRepository } from '../../../../src/modules/answers/answers.repository';
import { SessionsRepository } from '../../../../src/modules/sessions/sessions.repository';
import { QuestionsRepository } from '../../../../src/modules/questions/questions.repository';
import { PlayersRepository } from '../../../../src/modules/players/players.repository';
import { Session } from '../../../../src/modules/sessions/sessions.types';
import { Question } from '../../../../src/modules/questions/questions.types';
import { Player } from '../../../../src/modules/players/players.types';
import { Answer } from '../../../../src/modules/answers/answers.types';
import { Pool, PoolClient } from 'pg';

// ---- Test fixtures --------------------------------------------------------

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-uuid-1',
    playerId: 'player-uuid-1',
    mathModule: 'percentages',
    difficultyLevel: 'class5',
    status: 'active',
    totalQuestions: 10,
    questionsAnswered: 0,
    correctCount: 0,
    coinsEarned: 0,
    timeTakenSecs: null,
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: null,
    ...overrides,
  };
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'question-uuid-1',
    sessionId: 'session-uuid-1',
    mathModule: 'percentages',
    difficultyLevel: 'class5',
    questionText: 'What is 25% of 80?',
    options: ['20', '25', '30', '40'],
    correctOption: '20',
    hintText: 'Multiply 80 by 25 and divide by 100',
    sequenceNumber: 1,
    createdAt: new Date(),
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-uuid-1',
    displayName: 'Ashvik',
    avatarCode: 'default',
    totalCoins: 50,
    currentStreak: 0,
    longestStreak: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'answer-uuid-1',
    sessionId: 'session-uuid-1',
    questionId: 'question-uuid-1',
    playerId: 'player-uuid-1',
    chosenOption: '20',
    isCorrect: true,
    timeTakenMs: 3000,
    coinsAwarded: 15,
    answeredAt: new Date(),
    ...overrides,
  };
}

// ---- Mock Pool client -------------------------------------------------------

function createMockPoolClient(): PoolClient {
  return {
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: jest.fn(),
  } as unknown as PoolClient;
}

function createMockPool(client: PoolClient): Pool {
  return {
    connect: jest.fn().mockResolvedValue(client),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  } as unknown as Pool;
}

// ---- Tests -----------------------------------------------------------------

describe('AnswersService - submitAnswer', () => {
  let answersRepo: jest.Mocked<AnswersRepository>;
  let sessionsRepo: jest.Mocked<SessionsRepository>;
  let questionsRepo: jest.Mocked<QuestionsRepository>;
  let playersRepo: jest.Mocked<PlayersRepository>;
  let mockPoolClient: PoolClient;
  let mockPool: Pool;
  let service: AnswersService;

  beforeEach(() => {
    answersRepo = {
      create: jest.fn(),
      findBySession: jest.fn(),
      findBySessionAndQuestion: jest.fn(),
    } as unknown as jest.Mocked<AnswersRepository>;

    sessionsRepo = {
      findById: jest.fn(),
      updateProgress: jest.fn(),
      complete: jest.fn(),
      abandon: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<SessionsRepository>;

    questionsRepo = {
      findById: jest.fn(),
      saveMany: jest.fn(),
      findBySession: jest.fn(),
      findBySessionAndSequence: jest.fn(),
    } as unknown as jest.Mocked<QuestionsRepository>;

    playersRepo = {
      findById: jest.fn(),
      updateCoins: jest.fn(),
      updateStreak: jest.fn(),
      create: jest.fn(),
      findByName: jest.fn(),
      getStats: jest.fn(),
      getHistory: jest.fn(),
    } as unknown as jest.Mocked<PlayersRepository>;

    mockPoolClient = createMockPoolClient();
    mockPool = createMockPool(mockPoolClient);

    service = new AnswersService(
      answersRepo,
      sessionsRepo,
      questionsRepo,
      playersRepo,
      mockPool,
    );
  });

  function setupHappyPath(sessionOverrides: Partial<Session> = {}, playerOverrides: Partial<Player> = {}) {
    const session = makeSession(sessionOverrides);
    const question = makeQuestion();
    const player = makePlayer(playerOverrides);

    sessionsRepo.findById.mockResolvedValue(session);
    questionsRepo.findById.mockResolvedValue(question);
    answersRepo.findBySessionAndQuestion.mockResolvedValue(null);
    playersRepo.findById.mockResolvedValue(player);
    answersRepo.create.mockResolvedValue(makeAnswer());
    sessionsRepo.updateProgress.mockResolvedValue({ ...session, questionsAnswered: 1, correctCount: 1 });
    playersRepo.updateCoins.mockResolvedValue({ ...player, totalCoins: 65 });
    playersRepo.updateStreak.mockResolvedValue({ ...player, currentStreak: 1, totalCoins: 65 });
  }

  it('throws NOT_FOUND when session does not exist', async () => {
    sessionsRepo.findById.mockResolvedValue(null);
    await expect(
      service.submitAnswer('bad-session', 'q-id', { chosenOption: '20', timeTakenMs: 3000 }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws SESSION_ALREADY_COMPLETE when session is completed', async () => {
    sessionsRepo.findById.mockResolvedValue(makeSession({ status: 'completed' }));
    await expect(
      service.submitAnswer('session-uuid-1', 'q-id', { chosenOption: '20', timeTakenMs: 3000 }),
    ).rejects.toMatchObject({ code: 'SESSION_ALREADY_COMPLETE' });
  });

  it('throws SESSION_ABANDONED when session is abandoned', async () => {
    sessionsRepo.findById.mockResolvedValue(makeSession({ status: 'abandoned' }));
    await expect(
      service.submitAnswer('session-uuid-1', 'q-id', { chosenOption: '20', timeTakenMs: 3000 }),
    ).rejects.toMatchObject({ code: 'SESSION_ABANDONED' });
  });

  it('throws NOT_FOUND when question does not exist', async () => {
    sessionsRepo.findById.mockResolvedValue(makeSession());
    questionsRepo.findById.mockResolvedValue(null);
    await expect(
      service.submitAnswer('session-uuid-1', 'bad-q', { chosenOption: '20', timeTakenMs: 3000 }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws QUESTION_ALREADY_ANSWERED when question was already answered', async () => {
    sessionsRepo.findById.mockResolvedValue(makeSession());
    questionsRepo.findById.mockResolvedValue(makeQuestion());
    answersRepo.findBySessionAndQuestion.mockResolvedValue(makeAnswer());
    await expect(
      service.submitAnswer('session-uuid-1', 'question-uuid-1', { chosenOption: '20', timeTakenMs: 3000 }),
    ).rejects.toMatchObject({ code: 'QUESTION_ALREADY_ANSWERED' });
  });

  it('awards base coins for class5 correct answer (no speed/streak bonus)', async () => {
    setupHappyPath({ difficultyLevel: 'class5' }, { currentStreak: 0 });
    // slow answer: no speed bonus; streak 0: no streak bonus
    answersRepo.create.mockImplementation(async (data) => makeAnswer({ coinsAwarded: data.coinsAwarded }));
    playersRepo.updateStreak.mockResolvedValue(makePlayer({ currentStreak: 1, totalCoins: 60 }));

    const feedback = await service.submitAnswer('session-uuid-1', 'question-uuid-1', {
      chosenOption: '20',
      timeTakenMs: 15000, // > 10s: no speed bonus
    });

    // base=10, speed=0, streak bonus for newStreak=1 which is <3 so 0 => 10 coins
    expect(feedback.coinsAwarded).toBe(10);
    expect(feedback.isCorrect).toBe(true);
  });

  it('awards base coins for class6 correct answer', async () => {
    setupHappyPath({ difficultyLevel: 'class6' }, { currentStreak: 0 });
    const session = makeSession({ difficultyLevel: 'class6' });
    const question = makeQuestion({ difficultyLevel: 'class6' });
    sessionsRepo.findById.mockResolvedValue(session);
    questionsRepo.findById.mockResolvedValue(question);
    answersRepo.create.mockImplementation(async (data) => makeAnswer({ coinsAwarded: data.coinsAwarded }));
    playersRepo.updateStreak.mockResolvedValue(makePlayer({ currentStreak: 1, totalCoins: 65 }));

    const feedback = await service.submitAnswer('session-uuid-1', 'question-uuid-1', {
      chosenOption: '20',
      timeTakenMs: 15000, // slow: no speed bonus; newStreak=1 < 3 so no streak bonus
    });

    // base=15, speed=0, streak=0 => 15
    expect(feedback.coinsAwarded).toBe(15);
  });

  it('applies speed bonus of 5 for answers under 5000ms', async () => {
    setupHappyPath({ difficultyLevel: 'class5' }, { currentStreak: 0 });
    answersRepo.create.mockImplementation(async (data) => makeAnswer({ coinsAwarded: data.coinsAwarded }));
    playersRepo.updateStreak.mockResolvedValue(makePlayer({ currentStreak: 1, totalCoins: 65 }));

    const feedback = await service.submitAnswer('session-uuid-1', 'question-uuid-1', {
      chosenOption: '20',
      timeTakenMs: 3000, // < 5000: speed bonus = 5
    });

    // base=10, speed=5, streak(newStreak=1)=0 => 15
    expect(feedback.coinsAwarded).toBe(15);
  });

  it('applies speed bonus of 2 for answers between 5000-10000ms', async () => {
    setupHappyPath({ difficultyLevel: 'class5' }, { currentStreak: 0 });
    answersRepo.create.mockImplementation(async (data) => makeAnswer({ coinsAwarded: data.coinsAwarded }));
    playersRepo.updateStreak.mockResolvedValue(makePlayer({ currentStreak: 1, totalCoins: 62 }));

    const feedback = await service.submitAnswer('session-uuid-1', 'question-uuid-1', {
      chosenOption: '20',
      timeTakenMs: 7000, // 5000-10000: speed bonus = 2
    });

    // base=10, speed=2, streak(newStreak=1)=0 => 12
    expect(feedback.coinsAwarded).toBe(12);
  });

  it('applies streak bonus of 1 when new streak is >= 3', async () => {
    setupHappyPath({ difficultyLevel: 'class5' }, { currentStreak: 2 }); // will become 3
    answersRepo.create.mockImplementation(async (data) => makeAnswer({ coinsAwarded: data.coinsAwarded }));
    playersRepo.updateStreak.mockResolvedValue(makePlayer({ currentStreak: 3, totalCoins: 71 }));

    const feedback = await service.submitAnswer('session-uuid-1', 'question-uuid-1', {
      chosenOption: '20',
      timeTakenMs: 3000, // speed=5
    });

    // base=10, speed=5, streak(newStreak=3)=1 => 16
    expect(feedback.coinsAwarded).toBe(16);
  });

  it('applies streak bonus of 3 when new streak is >= 5', async () => {
    setupHappyPath({ difficultyLevel: 'class5' }, { currentStreak: 4 }); // will become 5
    answersRepo.create.mockImplementation(async (data) => makeAnswer({ coinsAwarded: data.coinsAwarded }));
    playersRepo.updateStreak.mockResolvedValue(makePlayer({ currentStreak: 5, totalCoins: 73 }));

    const feedback = await service.submitAnswer('session-uuid-1', 'question-uuid-1', {
      chosenOption: '20',
      timeTakenMs: 3000, // speed=5
    });

    // base=10, speed=5, streak(newStreak=5)=3 => 18
    expect(feedback.coinsAwarded).toBe(18);
  });

  it('awards 0 coins for incorrect answer', async () => {
    setupHappyPath();
    answersRepo.create.mockImplementation(async (data) => makeAnswer({ coinsAwarded: data.coinsAwarded, isCorrect: false }));
    sessionsRepo.updateProgress.mockResolvedValue(makeSession({ questionsAnswered: 1, correctCount: 0 }));
    playersRepo.updateStreak.mockResolvedValue(makePlayer({ currentStreak: 0 }));

    const feedback = await service.submitAnswer('session-uuid-1', 'question-uuid-1', {
      chosenOption: 'wrong-answer',
      timeTakenMs: 3000,
    });

    expect(feedback.coinsAwarded).toBe(0);
    expect(feedback.isCorrect).toBe(false);
  });

  it('returns the correct feedback structure', async () => {
    setupHappyPath();
    answersRepo.create.mockImplementation(async (data) => makeAnswer({ coinsAwarded: data.coinsAwarded }));
    playersRepo.updateStreak.mockResolvedValue(makePlayer({ currentStreak: 1, totalCoins: 65 }));

    const feedback = await service.submitAnswer('session-uuid-1', 'question-uuid-1', {
      chosenOption: '20',
      timeTakenMs: 3000,
    });

    expect(feedback).toHaveProperty('answerId');
    expect(feedback).toHaveProperty('isCorrect');
    expect(feedback).toHaveProperty('correctOption');
    expect(feedback).toHaveProperty('coinsAwarded');
    expect(feedback).toHaveProperty('currentStreak');
    expect(feedback).toHaveProperty('totalCoins');
    expect(feedback).toHaveProperty('explanation');
    expect(feedback).toHaveProperty('sessionProgress');
    expect(feedback.sessionProgress).toHaveProperty('isComplete');
  });

  it('completes the session when last question is answered', async () => {
    // 9 questions already answered
    const session = makeSession({ questionsAnswered: 9, correctCount: 9, totalQuestions: 10 });
    const question = makeQuestion();
    const player = makePlayer();

    sessionsRepo.findById.mockResolvedValue(session);
    questionsRepo.findById.mockResolvedValue(question);
    answersRepo.findBySessionAndQuestion.mockResolvedValue(null);
    playersRepo.findById.mockResolvedValue(player);
    answersRepo.create.mockImplementation(async (data) => makeAnswer({ coinsAwarded: data.coinsAwarded }));
    sessionsRepo.updateProgress.mockResolvedValue({ ...session, questionsAnswered: 10, correctCount: 10 });
    sessionsRepo.complete.mockResolvedValue({ ...session, questionsAnswered: 10, status: 'completed', completedAt: new Date() });
    playersRepo.updateCoins.mockResolvedValue({ ...player, totalCoins: 65 });
    playersRepo.updateStreak.mockResolvedValue({ ...player, currentStreak: 1, totalCoins: 65 });

    const feedback = await service.submitAnswer('session-uuid-1', 'question-uuid-1', {
      chosenOption: '20',
      timeTakenMs: 3000,
    });

    expect(sessionsRepo.complete).toHaveBeenCalledWith('session-uuid-1', expect.any(Number));
    expect(feedback.sessionProgress.isComplete).toBe(true);
  });
});
