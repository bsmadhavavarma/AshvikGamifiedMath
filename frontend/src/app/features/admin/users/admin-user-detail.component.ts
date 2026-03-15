import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface User { id: string; fullName: string; displayName: string; level: number; pin?: string; }
interface Session { id: string; theme_slug: string; class_level: number; subject: string; chapter_index: number; status: string; started_at: string; completed_at?: string; attempt_count: string; avg_score: string; }
interface Progress { class_level: number; subject: string; chapter_index: number; best_score: string; attempts: number; status: string; completed_at?: string; }

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="detail-container">
  <header>
    <button class="btn-back" (click)="router.navigate(['/admin'])">← All Users</button>
    @if (user()) {
      <div class="user-header">
        <h1>{{ user()!.fullName }}</h1>
        <span class="display-name">&#64;{{ user()!.displayName }}</span>
        <span class="level-chip">Class {{ user()!.level }}</span>
      </div>
    }
    <div class="header-links"><a href="/admin/observability">📊 Observability</a></div>
  </header>

  @if (error()) { <div class="error">{{ error() }}</div> }

  @if (user()) {
    <main>
      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <label>Sessions</label><span>{{ sessions().length }}</span>
        </div>
        <div class="stat-card">
          <label>Chapters Done</label><span>{{ progress().length }}</span>
        </div>
        <div class="stat-card">
          <label>Mastered</label><span>{{ masteredCount() }}</span>
        </div>
        <div class="stat-card">
          <label>Avg Best Score</label><span>{{ avgBestScore() | number:'1.0-0' }}%</span>
        </div>
      </div>

      <!-- Clear data -->
      <section class="panel">
        <h2>🗑 Clear Data</h2>
        <div class="clear-actions">
          <button class="btn-danger-outline" (click)="confirmClearAll()">Clear ALL Data</button>
          <div class="selective-clear">
            <select [ngModel]="clearLevel" (ngModelChange)="onClearLevelChange(+$event)" class="select-sm">
              @for (l of [1,2,3,4,5,6,7,8,9,10,11,12]; track l) {
                <option [value]="l">Class {{ l }}</option>
              }
            </select>
            <select [ngModel]="clearSubject" (ngModelChange)="clearSubject = $event" class="select-sm">
              <option value="">— any subject —</option>
              @for (s of clearSubjects(); track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
            <button class="btn-danger-outline" (click)="confirmClearSubject()">Clear This Subject</button>
          </div>
        </div>
      </section>

      <!-- Progress -->
      <section class="panel">
        <h2>📈 Progress</h2>
        @if (progress().length === 0) {
          <p class="muted">No progress yet.</p>
        } @else {
          <table class="data-table">
            <thead><tr><th>Class</th><th>Subject</th><th>Chapter</th><th>Status</th><th>Best Score</th><th>Attempts</th></tr></thead>
            <tbody>
              @for (p of progress(); track p.class_level + p.subject + p.chapter_index) {
                <tr>
                  <td>{{ p.class_level }}</td>
                  <td>{{ p.subject }}</td>
                  <td>Ch {{ p.chapter_index + 1 }}</td>
                  <td><span class="status-chip" [class]="'s-' + p.status">{{ p.status }}</span></td>
                  <td>{{ p.best_score | number:'1.0-1' }}%</td>
                  <td>{{ p.attempts }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <!-- Sessions -->
      <section class="panel">
        <h2>📚 Learning Sessions</h2>
        @if (sessions().length === 0) {
          <p class="muted">No sessions yet.</p>
        } @else {
          <table class="data-table">
            <thead><tr><th>Subject</th><th>Ch</th><th>Theme</th><th>Status</th><th>Questions</th><th>Avg Score</th><th>Date</th></tr></thead>
            <tbody>
              @for (s of sessions(); track s.id) {
                <tr>
                  <td>{{ s.subject }}</td>
                  <td>{{ s.chapter_index + 1 }}</td>
                  <td>{{ s.theme_slug }}</td>
                  <td><span class="status-chip" [class]="'s-' + s.status">{{ s.status }}</span></td>
                  <td>{{ s.attempt_count }}</td>
                  <td>{{ s.avg_score ? (s.avg_score | number:'1.0-1') + '%' : '—' }}</td>
                  <td>{{ s.started_at | date:'MMM d, y' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </main>
  }

  <!-- Confirm modal -->
  @if (confirmMsg()) {
    <div class="modal-overlay" (click)="confirmMsg.set('')">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>⚠️ Confirm</h3>
        <p>{{ confirmMsg() }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="confirmMsg.set('')">Cancel</button>
          <button class="btn-delete-confirm" (click)="doClear()">Yes, Clear</button>
        </div>
      </div>
    </div>
  }
</div>
  `,
  styles: [`
:host { display: block; min-height: 100vh; background: #0f1117; color: white; }
header { display: flex; align-items: center; gap: 16px; padding: 20px 32px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; }
.btn-back { background: none; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.6); padding: 8px 14px; border-radius: 8px; cursor: pointer; }
.user-header { flex: 1; display: flex; align-items: center; gap: 12px; h1 { margin: 0; font-size: 1.4rem; } }
.display-name { color: rgba(255,255,255,0.4); font-family: monospace; }
.level-chip { background: rgba(79,142,247,0.2); color: #93c5fd; padding: 4px 12px; border-radius: 16px; font-size: 0.85rem; }
.header-links a { color: #4f8ef7; text-decoration: none; }
main { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; label { display: block; font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; } span { font-size: 1.8rem; font-weight: 700; color: #4f8ef7; } }
.panel { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; margin-bottom: 24px; h2 { margin: 0 0 20px; font-size: 1.1rem; } }
.clear-actions { display: flex; flex-direction: column; gap: 14px; }
.selective-clear { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.select-sm, .input-sm { padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; font-size: 0.9rem; }
.input-sm { min-width: 180px; }
.btn-danger-outline { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; padding: 8px 16px; border-radius: 8px; cursor: pointer; &:hover { background: rgba(239,68,68,0.2); } }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; th { text-align: left; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); } td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); } }
.status-chip { padding: 3px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; &.s-completed, &.s-mastered { background: rgba(16,185,129,0.2); color: #10b981; } &.s-in_progress, &.s-evaluating { background: rgba(79,142,247,0.2); color: #93c5fd; } &.s-needs_repeat { background: rgba(245,158,11,0.2); color: #f59e0b; } &.s-remediation { background: rgba(239,68,68,0.2); color: #fca5a5; } &.s-teaching, &.s-not_started { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); } }
.muted { color: rgba(255,255,255,0.3); font-size: 0.9rem; }
.error { background: rgba(239,68,68,0.15); padding: 12px 24px; color: #fca5a5; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1a1d27; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; width: 420px; max-width: 95vw; h3 { margin: 0 0 16px; color: #fca5a5; } p { color: rgba(255,255,255,0.7); line-height: 1.5; margin-bottom: 0; } }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.btn-secondary { padding: 10px 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: white; cursor: pointer; }
.btn-delete-confirm { padding: 10px 20px; border-radius: 8px; border: none; background: #ef4444; color: white; cursor: pointer; font-weight: 700; }
  `]
})
export class AdminUserDetailComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  user = signal<User | null>(null);
  sessions = signal<Session[]>([]);
  progress = signal<Progress[]>([]);
  error = signal('');
  confirmMsg = signal('');
  clearLevel = 1;
  clearSubject = '';
  clearSubjects = signal<string[]>([]);
  private pendingClearLevel?: number;
  private pendingClearSubject?: string;

  ngOnInit() { this.load(); this.loadSubjectsForLevel(1); }

  onClearLevelChange(level: number) {
    this.clearLevel = level;
    this.clearSubject = '';
    this.loadSubjectsForLevel(level);
  }

  loadSubjectsForLevel(level: number) {
    this.api.get<{ subjects: Array<{ name: string }> }>(`/ncert/levels/${level}/subjects`).subscribe({
      next: r => this.clearSubjects.set(r.data.subjects.map(s => s.name)),
      error: () => this.clearSubjects.set([]),
    });
  }

  load() {
    const id = this.route.snapshot.params['id'];
    this.api.get<{ user: User; sessions: Session[]; progress: Progress[] }>(`/admin/users/${id}`).subscribe({
      next: r => {
        this.user.set(r.data.user);
        this.sessions.set(r.data.sessions);
        this.progress.set(r.data.progress);
      },
      error: () => this.error.set('Failed to load user data. Admin access only.'),
    });
  }

  masteredCount(): number { return this.progress().filter(p => p.status === 'mastered').length; }
  avgBestScore(): number {
    const p = this.progress();
    if (!p.length) return 0;
    return p.reduce((s, r) => s + parseFloat(r.best_score || '0'), 0) / p.length;
  }

  confirmClearAll() {
    this.pendingClearLevel = undefined;
    this.pendingClearSubject = undefined;
    this.confirmMsg.set(`Clear ALL learning data for ${this.user()?.displayName}? Sessions, evaluations, and progress will be deleted. The account remains.`);
  }

  confirmClearSubject() {
    this.pendingClearLevel = this.clearLevel;
    this.pendingClearSubject = this.clearSubject;
    this.confirmMsg.set(`Clear data for Class ${this.clearLevel} · ${this.clearSubject || '(all subjects)'}?`);
  }

  doClear() {
    const id = this.user()?.id;
    if (!id) return;
    let url = `/admin/users/${id}/data`;
    if (this.pendingClearLevel !== undefined) {
      url += `?classLevel=${this.pendingClearLevel}`;
      if (this.pendingClearSubject) url += `&subject=${encodeURIComponent(this.pendingClearSubject)}`;
    }
    this.api.delete(url).subscribe(() => { this.confirmMsg.set(''); this.load(); });
  }
}
