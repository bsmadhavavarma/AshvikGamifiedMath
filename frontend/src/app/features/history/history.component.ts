import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { ApiService, ApiPaginatedResponse } from '../../core/services/api.service';
import { PlayerHistoryEntry } from '../../core/models/player.model';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  private playerService = inject(PlayerService);
  private api = inject(ApiService);

  protected sessions = signal<PlayerHistoryEntry[]>([]);
  protected isLoading = signal(true);
  protected errorMessage = signal('');
  protected currentPage = signal(1);
  protected totalPages = signal(1);
  protected totalSessions = signal(0);

  protected player = computed(() => this.playerService.player());

  ngOnInit(): void {
    this.loadHistory(1);
  }

  protected loadHistory(page: number): void {
    const player = this.playerService.player();
    if (!player) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.api
      .getPaginated<PlayerHistoryEntry>(`/players/${player.id}/history`, {
        page,
        pageSize: PAGE_SIZE,
      })
      .subscribe({
        next: (res: ApiPaginatedResponse<PlayerHistoryEntry>) => {
          this.sessions.set(res.data);
          this.currentPage.set(res.pagination.page);
          this.totalPages.set(res.pagination.totalPages);
          this.totalSessions.set(res.pagination.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Failed to load history.');
        },
      });
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.loadHistory(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.loadHistory(this.currentPage() + 1);
    }
  }

  protected getAccuracy(entry: PlayerHistoryEntry): number {
    if (!entry.questionsAnswered) return 0;
    return Math.round((entry.correctCount / entry.questionsAnswered) * 100);
  }

  protected getStatusEmoji(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'abandoned': return '❌';
      default: return '⏳';
    }
  }

  protected formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
