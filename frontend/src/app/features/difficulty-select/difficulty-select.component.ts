import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { SessionService } from '../../core/services/session.service';
import { DifficultyLevel } from '../../core/models/session.model';

interface DifficultyOption {
  level: DifficultyLevel;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  topics: string[];
  description: string;
}

@Component({
  selector: 'app-difficulty-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './difficulty-select.component.html',
  styleUrl: './difficulty-select.component.scss',
})
export class DifficultySelectComponent {
  private playerService = inject(PlayerService);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  protected isLoading = signal<DifficultyLevel | null>(null);
  protected errorMessage = signal('');

  protected player = this.playerService.player;

  protected difficulties: DifficultyOption[] = [
    {
      level: 'class5',
      title: 'Class 5',
      subtitle: 'Beginner',
      icon: '📚',
      color: 'green',
      topics: [
        'What percentage of a number',
        'Simple percentage problems',
        'Percentage to fraction',
        'Basic discount problems',
      ],
      description: 'Perfect for building your foundation!',
    },
    {
      level: 'class6',
      title: 'Class 6',
      subtitle: 'Advanced',
      icon: '🚀',
      color: 'purple',
      topics: [
        'Percentage increase & decrease',
        'Profit and loss',
        'Multi-step problems',
        'Real-world applications',
      ],
      description: 'Challenge yourself and level up!',
    },
  ];

  selectDifficulty(level: DifficultyLevel): void {
    const player = this.playerService.player();
    if (!player) return;

    this.isLoading.set(level);
    this.errorMessage.set('');

    this.sessionService
      .createSession({
        playerId: player.id,
        mathModule: 'percentages',
        difficultyLevel: level,
      })
      .subscribe({
        next: (session) => {
          this.isLoading.set(null);
          void this.router.navigate(['/game', session.id]);
        },
        error: (err: unknown) => {
          this.isLoading.set(null);
          const message =
            err instanceof Error ? err.message : 'Failed to start session. Please try again!';
          this.errorMessage.set(message);
        },
      });
  }
}
