import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { PlayerService } from '../../core/services/player.service';
import { LeaderboardEntry } from '../../core/models/leaderboard.model';
import { OrdinalPipe } from '../../shared/pipes/ordinal.pipe';
import { Subscription, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

const REFRESH_INTERVAL_MS = 30000;

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterLink, OrdinalPipe],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  private leaderboardService = inject(LeaderboardService);
  private playerService = inject(PlayerService);

  protected entries = signal<LeaderboardEntry[]>([]);
  protected playerRank = signal<LeaderboardEntry | null>(null);
  protected isLoading = signal(true);
  protected errorMessage = signal('');
  protected lastUpdated = signal<Date | null>(null);

  protected currentPlayerId = computed(() => this.playerService.player()?.id ?? '');

  private subscription: Subscription | null = null;

  ngOnInit(): void {
    this.loadLeaderboard();

    // Refresh every 30 seconds
    this.subscription = interval(REFRESH_INTERVAL_MS).subscribe(() => {
      this.loadLeaderboard();
    });

    // Load player rank if logged in
    const player = this.playerService.player();
    if (player) {
      this.leaderboardService.getPlayerRank(player.id).subscribe({
        next: (rank) => this.playerRank.set(rank),
        error: () => {},
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadLeaderboard(): void {
    this.leaderboardService.getLeaderboard(10).subscribe({
      next: (res) => {
        this.entries.set(res.data);
        this.isLoading.set(false);
        this.lastUpdated.set(new Date());
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Failed to load leaderboard.');
      },
    });
  }

  protected isCurrentPlayer(entry: LeaderboardEntry): boolean {
    return entry.playerId === this.currentPlayerId();
  }

  protected getRankEmoji(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  }
}
