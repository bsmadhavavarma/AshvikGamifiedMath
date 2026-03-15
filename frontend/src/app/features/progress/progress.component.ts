import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface ProgressItem { class_level: number; subject: string; chapter_index: number; best_score: number; attempts: number; status: string; completed_at: string; }

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss'],
})
export class ProgressComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  progress = signal<ProgressItem[]>([]);

  ngOnInit() {
    this.api.get<{ progress: ProgressItem[] }>('/evaluation/progress').subscribe(r => this.progress.set(r.data.progress));
  }

  statusIcon(status: string): string {
    return { mastered: '🏆', completed: '✅', in_progress: '🔄', not_started: '⭕' }[status] ?? '⭕';
  }

  goHome() { this.router.navigate(['/home']); }
}
