import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

interface Theme { id: string; name: string; slug: string; description: string; }
interface Subject { name: string; chapterCount: number; }

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

  themes = signal<Theme[]>([]);
  subjects = signal<Subject[]>([]);
  selectedTheme = signal<Theme | null>(null);
  selectedSubject = signal<Subject | null>(null);
  selectedChapter = signal(0);
  editingLevel = signal(false);
  get newLevel() { return this._newLevel; }
  private _newLevel = signal(this.auth.currentUser()?.level ?? 1);
  setNewLevel(v: number) { this._newLevel.set(v); }

  themeIcons: Record<string, string> = {
    'quest': '⚔️',
    'space-explorer': '🚀',
    'time-traveler': '⏳',
    'detective': '🔍',
  };

  ngOnInit() {
    this.api.get<{ themes: Theme[] }>('/themes').subscribe(r => this.themes.set(r.data.themes));
    this.loadSubjects();
  }

  loadSubjects() {
    const level = this.auth.currentUser()?.level ?? 1;
    this.api.get<{ subjects: Subject[] }>(`/ncert/levels/${level}/subjects`).subscribe(r => this.subjects.set(r.data.subjects));
  }

  startLearning() {
    const theme = this.selectedTheme();
    const subject = this.selectedSubject();
    const user = this.auth.currentUser();
    if (!theme || !subject || !user) return;
    this.router.navigate(['/learn', theme.slug, user.level, encodeURIComponent(subject.name), this.selectedChapter()]);
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

  chaptersFor(subject: Subject | null): number[] {
    if (!subject) return [];
    return Array.from({ length: subject.chapterCount }, (_, i) => i);
  }
}
