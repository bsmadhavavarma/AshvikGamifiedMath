import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { GameStore } from '../../state/game.store';
import { PlayerService } from '../../core/services/player.service';
import { SessionService } from '../../core/services/session.service';
import { QuestionService } from '../../core/services/question.service';
import { AnswerService } from '../../core/services/answer.service';
import { SoundService } from '../../core/services/sound.service';
import { Question } from '../../core/models/question.model';
import { AnswerFeedback } from '../../core/models/answer.model';

import { ScoreHudComponent } from './score-hud/score-hud.component';
import { QuestionCardComponent } from './question-card/question-card.component';
import { AnswerOptionsComponent } from './answer-options/answer-options.component';
import { TimerBarComponent } from '../../shared/components/timer-bar/timer-bar.component';
import { FeedbackOverlayComponent } from './feedback-overlay/feedback-overlay.component';

const TIMER_DURATION_MS = 15000;
const FEEDBACK_DISPLAY_MS = 2500;

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    ScoreHudComponent,
    QuestionCardComponent,
    AnswerOptionsComponent,
    TimerBarComponent,
    FeedbackOverlayComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gameStore = inject(GameStore);
  private playerService = inject(PlayerService);
  private sessionService = inject(SessionService);
  private questionService = inject(QuestionService);
  private answerService = inject(AnswerService);
  private soundService = inject(SoundService);

  protected gameStore$ = this.gameStore;

  protected sessionId = signal('');
  protected currentQuestion = signal<Question | null>(null);
  protected isLoading = signal(true);
  protected isAnswering = signal(false);
  protected showFeedback = signal(false);
  protected feedback = signal<AnswerFeedback | null>(null);
  protected selectedOption = signal<string | null>(null);
  protected timerActive = signal(false);
  protected questionStartTime = signal(0);
  protected errorMessage = signal('');

  // Prefetched next question
  private nextQuestion: Question | null = null;

  private subscriptions: Subscription[] = [];
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    const player = this.playerService.player();

    if (!sessionId || !player) {
      void this.router.navigate(['/']);
      return;
    }

    this.sessionId.set(sessionId);
    this.gameStore.initSession(sessionId, 10, player.displayName);
    this.loadQuestion(1);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }
  }

  private loadQuestion(sequenceNumber: number): void {
    this.isLoading.set(true);
    this.timerActive.set(false);
    this.currentQuestion.set(null);
    this.selectedOption.set(null);
    this.showFeedback.set(false);
    this.feedback.set(null);

    const sid = this.sessionId();
    const sub = this.questionService.getQuestion(sid, sequenceNumber).subscribe({
      next: (q) => {
        this.currentQuestion.set(q);
        this.gameStore.setQuestion(q);
        this.isLoading.set(false);
        this.questionStartTime.set(Date.now());
        this.timerActive.set(true);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Failed to load question. Please try again.');
      },
    });

    this.subscriptions.push(sub);
  }

  private prefetchNextQuestion(nextSeq: number): void {
    if (nextSeq > this.gameStore.totalQuestions()) return;

    const sid = this.sessionId();
    const sub = this.questionService.getQuestion(sid, nextSeq).subscribe({
      next: (q) => {
        this.nextQuestion = q;
      },
      error: () => {
        this.nextQuestion = null;
      },
    });

    this.subscriptions.push(sub);
  }

  protected onTimerExpired(): void {
    if (this.isAnswering() || this.showFeedback()) return;
    this.submitAnswer(null);
  }

  protected onOptionSelected(option: string): void {
    if (this.isAnswering() || this.showFeedback()) return;
    this.selectedOption.set(option);
    this.submitAnswer(option);
  }

  private submitAnswer(chosenOption: string | null): void {
    const question = this.currentQuestion();
    if (!question) return;

    const player = this.playerService.player();
    if (!player) return;

    this.isAnswering.set(true);
    this.timerActive.set(false);

    const timeTakenMs = Date.now() - this.questionStartTime();
    const sid = this.sessionId();
    const nextSeq = this.gameStore.sequenceNumber() + 1;

    // Prefetch next question while waiting for answer feedback
    this.prefetchNextQuestion(nextSeq);

    const sub = this.answerService
      .submitAnswer(sid, question.id, { chosenOption, timeTakenMs })
      .subscribe({
        next: (fb: AnswerFeedback) => {
          this.isAnswering.set(false);
          this.feedback.set(fb);
          this.gameStore.recordAnswer(fb);

          // Play sound
          if (fb.isCorrect) {
            if (fb.currentStreak >= 3) {
              this.soundService.playLevelUp();
            } else {
              this.soundService.playCorrect();
            }
          } else {
            this.soundService.playWrong();
          }

          this.showFeedback.set(true);

          // Auto-advance after 2.5 seconds
          this.feedbackTimer = setTimeout(() => {
            this.advanceToNextQuestion(fb);
          }, FEEDBACK_DISPLAY_MS);
        },
        error: () => {
          this.isAnswering.set(false);
          this.errorMessage.set('Failed to submit answer. Advancing...');
          this.feedbackTimer = setTimeout(() => {
            this.advanceOrComplete();
          }, 1500);
        },
      });

    this.subscriptions.push(sub);
  }

  private advanceToNextQuestion(fb: AnswerFeedback): void {
    if (fb.sessionProgress.isComplete) {
      this.gameStore.completeSession();
      void this.router.navigate(['/results', this.sessionId()]);
      return;
    }

    this.gameStore.advanceQuestion();
    this.showFeedback.set(false);
    this.feedback.set(null);

    const nextSeq = this.gameStore.sequenceNumber();

    // Use prefetched question if available
    if (this.nextQuestion && this.nextQuestion.sequenceNumber === nextSeq) {
      const q = this.nextQuestion;
      this.nextQuestion = null;
      this.currentQuestion.set(q);
      this.gameStore.setQuestion(q);
      this.selectedOption.set(null);
      this.questionStartTime.set(Date.now());
      this.timerActive.set(true);
    } else {
      this.nextQuestion = null;
      this.loadQuestion(nextSeq);
    }
  }

  private advanceOrComplete(): void {
    const seq = this.gameStore.sequenceNumber();
    if (seq >= this.gameStore.totalQuestions()) {
      void this.router.navigate(['/results', this.sessionId()]);
    } else {
      this.gameStore.advanceQuestion();
      this.loadQuestion(this.gameStore.sequenceNumber());
    }
  }

  protected get timerDurationMs(): number {
    return TIMER_DURATION_MS;
  }
}
