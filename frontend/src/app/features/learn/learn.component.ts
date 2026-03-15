import { Component, signal, inject, OnInit, OnDestroy, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { timeout } from 'rxjs/operators';
import { Subscription, interval } from 'rxjs';

interface Section { heading: string; body: string; keyPoints: string[]; diagram?: string | null; }
interface TeachingContent {
  chapterTitle: string;
  source: { classLevel: number; subject: string; chapterTitle: string; };
  topics: string[];
  sections: Section[];
  summary: string;
  fromCache: boolean;
}

@Component({
  selector: 'app-learn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learn.component.html',
  styleUrls: ['./learn.component.scss'],
})
export class LearnComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  content = signal<TeachingContent | null>(null);
  loading = signal(true);
  error = signal('');
  slowWarning = signal(false);
  currentSection = signal(-1); // -1 = show overview
  params!: { theme: string; level: string; subject: string; chapter: string; };

  private timerSub?: Subscription;
  private elapsed = 0;

  ngOnInit() {
    const p = this.route.snapshot.params;
    this.params = { theme: p['theme'], level: p['level'], subject: p['subject'], chapter: p['chapter'] };

    // Show "taking longer" warning after 25s
    this.timerSub = interval(1000).subscribe(() => {
      this.elapsed++;
      if (this.elapsed === 25) this.slowWarning.set(true);
    });

    this.api.get<TeachingContent>(
      `/content/${this.params.theme}/${this.params.level}/${this.params.subject}/${this.params.chapter}/teach`
    ).pipe(timeout(60000)).subscribe({
      next: r => {
        this.content.set(r.data);
        this.loading.set(false);
        this.slowWarning.set(false);
        this.timerSub?.unsubscribe();
        // Show overview first (topics list) before section 0
        this.currentSection.set(-1);
      },
      error: (err) => {
        const msg = err?.name === 'TimeoutError'
          ? 'Request timed out after 60 seconds. Please go back and try again.'
          : 'Failed to load content. Please try again.';
        this.error.set(msg);
        this.loading.set(false);
        this.timerSub?.unsubscribe();
      },
    });
  }

  ngOnDestroy() { this.timerSub?.unsubscribe(); }

  safeSvg(svg: string | null | undefined): string {
    if (!svg) return '';
    return this.sanitizer.sanitize(SecurityContext.HTML, svg) ?? '';
  }

  goBack() { this.router.navigate(['/home']); }

  startReading() { this.currentSection.set(0); }

  goEvaluate() {
    const { theme, level, subject, chapter } = this.params;
    this.router.navigate(['/evaluate', theme, level, subject, chapter]);
  }

  next() {
    if (this.currentSection() < (this.content()?.sections.length ?? 0) - 1)
      this.currentSection.update(n => n + 1);
  }
  prev() {
    if (this.currentSection() > 0) this.currentSection.update(n => n - 1);
    else this.currentSection.set(-1); // back to overview
  }
  isLast(): boolean { return this.currentSection() === (this.content()?.sections.length ?? 0) - 1; }
  isOverview(): boolean { return this.currentSection() === -1; }
}
