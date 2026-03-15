import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface Section { heading: string; body: string; keyPoints: string[]; }
interface TeachingContent { chapterTitle: string; sections: Section[]; summary: string; fromCache: boolean; }

@Component({
  selector: 'app-learn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learn.component.html',
  styleUrls: ['./learn.component.scss'],
})
export class LearnComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  content = signal<TeachingContent | null>(null);
  loading = signal(true);
  error = signal('');
  currentSection = signal(0);
  params!: { theme: string; level: string; subject: string; chapter: string; };

  ngOnInit() {
    const p = this.route.snapshot.params;
    this.params = { theme: p['theme'], level: p['level'], subject: p['subject'], chapter: p['chapter'] };
    this.api.get<TeachingContent>(`/content/${this.params.theme}/${this.params.level}/${this.params.subject}/${this.params.chapter}/teach`)
      .subscribe({
        next: r => { this.content.set(r.data); this.loading.set(false); },
        error: () => { this.error.set('Failed to load content. Please try again.'); this.loading.set(false); },
      });
  }

  goBack() { this.router.navigate(['/home']); }

  goEvaluate() {
    const { theme, level, subject, chapter } = this.params;
    this.router.navigate(['/evaluate', theme, level, subject, chapter]);
  }

  next() { if (this.currentSection() < (this.content()?.sections.length ?? 0) - 1) this.currentSection.update(n => n + 1); }
  prev() { if (this.currentSection() > 0) this.currentSection.update(n => n - 1); }
  isLast(): boolean { return this.currentSection() === (this.content()?.sections.length ?? 0) - 1; }
}
