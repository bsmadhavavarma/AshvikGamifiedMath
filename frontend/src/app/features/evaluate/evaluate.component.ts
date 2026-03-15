import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

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
export class EvaluateComponent implements OnInit {
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
  params!: { theme: string; level: string; subject: string; chapter: string; };

  ngOnInit() {
    const p = this.route.snapshot.params;
    this.params = { theme: p['theme'], level: p['level'], subject: p['subject'], chapter: p['chapter'] };

    // Create session then load questions
    this.api.post<{ sessionId: string }>('/evaluation/sessions', {
      themeSlug: this.params.theme, classLevel: parseInt(this.params.level),
      subject: decodeURIComponent(this.params.subject), chapterIndex: parseInt(this.params.chapter),
    }).subscribe(r => {
      this.sessionId.set(r.data.sessionId);
      this.api.get<EvalSet>(`/content/${this.params.theme}/${this.params.level}/${this.params.subject}/${this.params.chapter}/evaluate`)
        .subscribe(er => { this.evalSet.set(er.data); this.loading.set(false); });
    });
  }

  submitAnswer() {
    const q = this.evalSet()!.questions[this.currentQ()];
    if (!q || !this.userAnswer()) return;
    this.submitting.set(true);
    this.api.post<EvalResult>('/evaluation/answers', {
      sessionId: this.sessionId(), questionIndex: q.index, questionType: q.type,
      questionText: q.question, userAnswer: this.userAnswer(),
      sampleAnswer: q.sampleAnswer, themeSlug: this.params.theme,
    }).subscribe(r => { this.result.set(r.data); this.submitting.set(false); });
  }

  nextQuestion() {
    this.result.set(null);
    this.userAnswer.set('');
    const total = this.evalSet()!.questions.length;
    if (this.currentQ() < total - 1) {
      this.currentQ.update(n => n + 1);
    } else {
      // Get decision
      this.api.get<Decision>(`/evaluation/sessions/${this.sessionId()}/decision`).subscribe(r => {
        this.decision.set(r.data);
      });
    }
  }

  handleDecision() {
    const d = this.decision();
    if (!d) return;
    if (d.action === 'complete' || d.action === 'repeat_chapter') {
      this.router.navigate(['/home']);
    } else if (d.action === 'remediation') {
      this.router.navigate(['/home']);
    }
  }

  selectOption(option: string) { this.userAnswer.set(option); }
  progress(): number { return ((this.currentQ() + 1) / (this.evalSet()?.questions.length ?? 1)) * 100; }
}
