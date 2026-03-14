import { Injectable, signal, computed } from '@angular/core';
import { Question } from '../core/models/question.model';
import { AnswerFeedback } from '../core/models/answer.model';

@Injectable({
  providedIn: 'root',
})
export class GameStore {
  // Core signals
  private _sessionId = signal<string | null>(null);
  private _currentQuestion = signal<Question | null>(null);
  private _sequenceNumber = signal(1);
  private _totalQuestions = signal(10);
  private _coinsThisSession = signal(0);
  private _currentStreak = signal(0);
  private _lastFeedback = signal<AnswerFeedback | null>(null);
  private _sessionComplete = signal(false);
  private _playerDisplayName = signal<string>('');
  private _correctCount = signal(0);

  // Public readonly signals
  readonly sessionId = this._sessionId.asReadonly();
  readonly currentQuestion = this._currentQuestion.asReadonly();
  readonly sequenceNumber = this._sequenceNumber.asReadonly();
  readonly totalQuestions = this._totalQuestions.asReadonly();
  readonly coinsThisSession = this._coinsThisSession.asReadonly();
  readonly currentStreak = this._currentStreak.asReadonly();
  readonly lastFeedback = this._lastFeedback.asReadonly();
  readonly sessionComplete = this._sessionComplete.asReadonly();
  readonly playerDisplayName = this._playerDisplayName.asReadonly();
  readonly correctCount = this._correctCount.asReadonly();

  // Computed
  readonly accuracy = computed(() => {
    const answered = this._sequenceNumber() - 1;
    if (answered === 0) return 0;
    return Math.round((this._correctCount() / answered) * 100);
  });

  readonly progressPercent = computed(() => {
    const answered = this._sequenceNumber() - 1;
    return Math.round((answered / this._totalQuestions()) * 100);
  });

  initSession(
    sessionId: string,
    totalQuestions: number,
    playerDisplayName: string,
  ): void {
    this._sessionId.set(sessionId);
    this._totalQuestions.set(totalQuestions);
    this._playerDisplayName.set(playerDisplayName);
    this._sequenceNumber.set(1);
    this._coinsThisSession.set(0);
    this._currentStreak.set(0);
    this._lastFeedback.set(null);
    this._sessionComplete.set(false);
    this._correctCount.set(0);
    this._currentQuestion.set(null);
  }

  setQuestion(question: Question): void {
    this._currentQuestion.set(question);
  }

  recordAnswer(feedback: AnswerFeedback): void {
    this._lastFeedback.set(feedback);
    this._coinsThisSession.set(feedback.sessionProgress.coinsEarned);
    this._currentStreak.set(feedback.currentStreak);
    this._correctCount.set(feedback.sessionProgress.correctCount);
  }

  advanceQuestion(): void {
    const next = this._sequenceNumber() + 1;
    this._sequenceNumber.set(next);
    this._lastFeedback.set(null);
    this._currentQuestion.set(null);
  }

  completeSession(): void {
    this._sessionComplete.set(true);
  }

  reset(): void {
    this._sessionId.set(null);
    this._currentQuestion.set(null);
    this._sequenceNumber.set(1);
    this._totalQuestions.set(10);
    this._coinsThisSession.set(0);
    this._currentStreak.set(0);
    this._lastFeedback.set(null);
    this._sessionComplete.set(false);
    this._playerDisplayName.set('');
    this._correctCount.set(0);
  }
}
