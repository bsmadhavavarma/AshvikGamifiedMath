import { TestBed } from '@angular/core/testing';
import { GameStore } from './game.store';
import { AnswerFeedback } from '../core/models/answer.model';
import { Question } from '../core/models/question.model';

const mockQuestion: Question = {
  id: 'q-001',
  sessionId: 'session-123',
  questionText: 'What is 25% of 80?',
  options: ['15', '20', '25', '30'],
  sequenceNumber: 1,
};

function makeFeedback(overrides: Partial<AnswerFeedback> = {}): AnswerFeedback {
  return {
    answerId: 'ans-001',
    isCorrect: true,
    correctOption: '20',
    chosenOption: '20',
    coinsAwarded: 10,
    currentStreak: 1,
    totalCoins: 60,
    explanation: '25% of 80 = 20',
    sessionProgress: {
      questionsAnswered: 1,
      totalQuestions: 10,
      correctCount: 1,
      coinsEarned: 10,
      isComplete: false,
    },
    ...overrides,
  };
}

describe('GameStore', () => {
  let store: GameStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameStore],
    });
    store = TestBed.inject(GameStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('initSession', () => {
    it('should initialize session with correct values', () => {
      store.initSession('session-123', 10, 'Ashvik');

      expect(store.sessionId()).toBe('session-123');
      expect(store.totalQuestions()).toBe(10);
      expect(store.playerDisplayName()).toBe('Ashvik');
      expect(store.sequenceNumber()).toBe(1);
      expect(store.coinsThisSession()).toBe(0);
      expect(store.currentStreak()).toBe(0);
      expect(store.sessionComplete()).toBeFalse();
    });

    it('should reset all state on init', () => {
      store.initSession('session-1', 10, 'Test');
      store.recordAnswer(makeFeedback({ currentStreak: 5 }));

      store.initSession('session-2', 10, 'Test2');

      expect(store.currentStreak()).toBe(0);
      expect(store.coinsThisSession()).toBe(0);
      expect(store.sessionId()).toBe('session-2');
    });
  });

  describe('setQuestion', () => {
    it('should set the current question', () => {
      store.initSession('s1', 10, 'Test');
      store.setQuestion(mockQuestion);

      expect(store.currentQuestion()).toEqual(mockQuestion);
    });
  });

  describe('recordAnswer', () => {
    beforeEach(() => {
      store.initSession('session-123', 10, 'Ashvik');
    });

    it('should update coins from sessionProgress', () => {
      const feedback = makeFeedback({ sessionProgress: { ...makeFeedback().sessionProgress, coinsEarned: 10 } });
      store.recordAnswer(feedback);

      expect(store.coinsThisSession()).toBe(10);
    });

    it('should update currentStreak correctly', () => {
      store.recordAnswer(makeFeedback({ currentStreak: 1 }));
      expect(store.currentStreak()).toBe(1);

      store.recordAnswer(makeFeedback({ currentStreak: 2 }));
      expect(store.currentStreak()).toBe(2);
    });

    it('should reset streak to 0 on wrong answer', () => {
      store.recordAnswer(makeFeedback({ currentStreak: 3 }));
      expect(store.currentStreak()).toBe(3);

      store.recordAnswer(makeFeedback({ isCorrect: false, currentStreak: 0 }));
      expect(store.currentStreak()).toBe(0);
    });

    it('should set lastFeedback', () => {
      const fb = makeFeedback();
      store.recordAnswer(fb);
      expect(store.lastFeedback()).toEqual(fb);
    });

    it('should update correctCount', () => {
      store.recordAnswer(
        makeFeedback({
          sessionProgress: { ...makeFeedback().sessionProgress, correctCount: 1 },
        }),
      );
      expect(store.correctCount()).toBe(1);
    });
  });

  describe('advanceQuestion', () => {
    it('should increment sequenceNumber', () => {
      store.initSession('s1', 10, 'Test');
      expect(store.sequenceNumber()).toBe(1);

      store.advanceQuestion();
      expect(store.sequenceNumber()).toBe(2);

      store.advanceQuestion();
      expect(store.sequenceNumber()).toBe(3);
    });

    it('should clear lastFeedback and currentQuestion', () => {
      store.initSession('s1', 10, 'Test');
      store.setQuestion(mockQuestion);
      store.recordAnswer(makeFeedback());

      store.advanceQuestion();

      expect(store.lastFeedback()).toBeNull();
      expect(store.currentQuestion()).toBeNull();
    });
  });

  describe('completeSession', () => {
    it('should set sessionComplete to true', () => {
      store.initSession('s1', 10, 'Test');
      expect(store.sessionComplete()).toBeFalse();

      store.completeSession();
      expect(store.sessionComplete()).toBeTrue();
    });
  });

  describe('reset', () => {
    it('should reset all state to defaults', () => {
      store.initSession('s1', 10, 'Test');
      store.recordAnswer(makeFeedback({ currentStreak: 5 }));
      store.completeSession();

      store.reset();

      expect(store.sessionId()).toBeNull();
      expect(store.currentQuestion()).toBeNull();
      expect(store.sequenceNumber()).toBe(1);
      expect(store.coinsThisSession()).toBe(0);
      expect(store.currentStreak()).toBe(0);
      expect(store.sessionComplete()).toBeFalse();
    });
  });

  describe('computed signals', () => {
    it('accuracy should be 0 when no answers', () => {
      store.initSession('s1', 10, 'Test');
      expect(store.accuracy()).toBe(0);
    });

    it('accuracy should be 100 when all correct', () => {
      store.initSession('s1', 10, 'Test');
      store.recordAnswer(
        makeFeedback({
          sessionProgress: { ...makeFeedback().sessionProgress, correctCount: 1, questionsAnswered: 1 },
        }),
      );
      store.advanceQuestion();

      expect(store.accuracy()).toBe(100);
    });

    it('progressPercent should update as questions advance', () => {
      store.initSession('s1', 10, 'Test');
      expect(store.progressPercent()).toBe(0);

      store.advanceQuestion(); // now on Q2, answered=1
      expect(store.progressPercent()).toBe(10);
    });
  });
});
