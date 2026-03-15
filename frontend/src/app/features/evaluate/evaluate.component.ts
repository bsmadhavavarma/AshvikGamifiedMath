import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { timeout } from 'rxjs/operators';
import { Subscription, interval } from 'rxjs';

interface Question { index: number; type: string; question: string; themeWrapper: string; options?: string[]; sampleAnswer?: string; }
interface EvalSet { questions: Question[]; themeSlug: string; fromCache: boolean; }
interface EvalResult { isCorrect: boolean; score: number; feedback: string; themeFeedback: string; }
interface Decision { action: string; message: string; remediationLevel?: number; }

@Component({
  selector: 'app-evaluate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluate.component.html',
  styleUrls: ['./evaluate.component.scss'],
})
export class EvaluateComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  evalSet = signal<EvalSet | null>(null);
  sessionId = signal('');
  currentQ = signal(0);
  userAnswer = signal('');
  result = signal<EvalResult | null>(null);
  decision = signal<Decision | null>(null);
  loading = signal(true);
  submitting = signal(false);
  submitError = signal('');
  slowWarning = signal(false);
  params!: { theme: string; level: string; subject: string; chapter: string; };

  private timerSub?: Subscription;
  private submitElapsed = 0;

  ngOnInit() {
    const p = this.route.snapshot.params;
    this.params = { theme: p['theme'], level: p['level'], subject: p['subject'], chapter: p['chapter'] };

    this.api.post<{ sessionId: string }>('/evaluation/sessions', {
      themeSlug: this.params.theme, classLevel: parseInt(this.params.level),
      subject: decodeURIComponent(this.params.subject), chapterIndex: parseInt(this.params.chapter),
    }).subscribe(r => {
      this.sessionId.set(r.data.sessionId);
      this.api.get<EvalSet>(`/content/${this.params.theme}/${this.params.level}/${this.params.subject}/${this.params.chapter}/evaluate`)
        .pipe(timeout(60000))
        .subscribe({
          next: er => { this.evalSet.set(er.data); this.loading.set(false); },
          error: () => { this.loading.set(false); this.submitError.set('Failed to load questions. Please go back and try again.'); },
        });
    });
  }

  ngOnDestroy() { this.timerSub?.unsubscribe(); }

  private startSlowTimer() {
    this.submitElapsed = 0;
    this.slowWarning.set(false);
    this.timerSub?.unsubscribe();
    this.timerSub = interval(1000).subscribe(() => {
      this.submitElapsed++;
      if (this.submitElapsed === 25) this.slowWarning.set(true);
    });
  }

  submitAnswer() {
    const q = this.evalSet()!.questions[this.currentQ()];
    if (!q || !this.userAnswer()) return;
    this.submitting.set(true);
    this.submitError.set('');
    this.startSlowTimer();

    this.api.post<EvalResult>('/evaluation/answers', {
      sessionId: this.sessionId(), questionIndex: q.index, questionType: q.type,
      questionText: q.question, userAnswer: this.userAnswer(),
      sampleAnswer: q.sampleAnswer, themeSlug: this.params.theme,
    }).pipe(timeout(60000)).subscribe({
      next: r => {
        this.result.set(r.data);
        this.submitting.set(false);
        this.slowWarning.set(false);
        this.timerSub?.unsubscribe();
      },
      error: (err) => {
        const msg = err?.name === 'TimeoutError'
          ? 'Evaluation timed out after 60 seconds.'
          : 'Failed to evaluate answer.';
        this.submitError.set(msg + ' Please go back and try again.');
        this.submitting.set(false);
        this.slowWarning.set(false);
        this.timerSub?.unsubscribe();
      },
    });
  }

  nextQuestion() {
    this.result.set(null);
    this.userAnswer.set('');
    this.submitError.set('');
    const total = this.evalSet()!.questions.length;
    if (this.currentQ() < total - 1) {
      this.currentQ.update(n => n + 1);
    } else {
      this.api.get<Decision>(`/evaluation/sessions/${this.sessionId()}/decision`).subscribe(r => {
        this.decision.set(r.data);
      });
    }
  }

  handleDecision() {
    const d = this.decision();
    if (!d) return;
    this.router.navigate(['/home']);
  }

  selectOption(option: string) { this.userAnswer.set(option); }
  progress(): number { return ((this.currentQ() + 1) / (this.evalSet()?.questions.length ?? 1)) * 100; }
  goBack() { this.router.navigate(['/home']); }
}
