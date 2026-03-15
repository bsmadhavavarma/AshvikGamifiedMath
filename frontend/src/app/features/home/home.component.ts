import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

interface Subject { name: string; chapterCount: number; }
interface Chapter { index: number; title: string; hasMarkdown: boolean; }

const DEFAULT_THEME = 'quest';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  subjects = signal<Subject[]>([]);
  chapters = signal<Chapter[]>([]);
  selectedSubject = signal<Subject | null>(null);
  selectedChapter = signal<Chapter | null>(null);
  editingLevel = signal(false);
  get newLevel() { return this._newLevel; }
  private _newLevel = signal(this.auth.currentUser()?.level ?? 1);
  setNewLevel(v: number) { this._newLevel.set(v); }

  ngOnInit() { this.loadSubjects(); }

  loadSubjects() {
    const level = this.auth.currentUser()?.level ?? 1;
    this.api.get<{ subjects: Subject[] }>(`/ncert/levels/${level}/subjects`)
      .subscribe(r => { this.subjects.set(r.data.subjects); this.selectedSubject.set(null); this.chapters.set([]); });
  }

  selectSubject(subject: Subject) {
    this.selectedSubject.set(subject);
    this.selectedChapter.set(null);
    const level = this.auth.currentUser()?.level ?? 1;
    this.api.get<{ chapters: Chapter[] }>(`/ncert/levels/${level}/subjects/${encodeURIComponent(subject.name)}/chapters`)
      .subscribe(r => this.chapters.set(r.data.chapters));
  }

  startLearning() {
    const subject = this.selectedSubject();
    const chapter = this.selectedChapter();
    const user = this.auth.currentUser();
    if (!subject || chapter === null || !user) return;
    this.router.navigate(['/learn', DEFAULT_THEME, user.level, encodeURIComponent(subject.name), chapter.index]);
  }

  saveLevel() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const level = this._newLevel();
    this.api.patch(`/admin/users/${userId}/level`, { level }).subscribe(() => {
      this.auth.updateLevel(level);
      this.editingLevel.set(false);
      this.loadSubjects();
    });
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}
