import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { GameStore } from '../../state/game.store';
import { Session } from '../../core/models/session.model';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { ConfettiComponent } from '../../shared/components/confetti/confetti.component';
import { SoundService } from '../../core/services/sound.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StarRatingComponent,
    ConfettiComponent,
  ],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss',
})
export class ResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sessionService = inject(SessionService);
  private gameStore = inject(GameStore);
  private soundService = inject(SoundService);

  protected session = signal<Session | null>(null);
  protected isLoading = signal(true);
  protected errorMessage = signal('');

  protected accuracy = computed(() => {
    const s = this.session();
    if (!s || s.questionsAnswered === 0) return 0;
    return Math.round((s.correctCount / s.questionsAnswered) * 100);
  });

  protected showConfetti = computed(() => this.accuracy() >= 80);

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';

    if (!sessionId) {
      void this.router.navigate(['/']);
      return;
    }

    this.sessionService.getSession(sessionId).subscribe({
      next: (s) => {
        this.session.set(s);
        this.isLoading.set(false);

        if (this.accuracy() >= 80) {
          this.soundService.playLevelUp();
        }
      },
      error: () => {
        this.isLoading.set(false);
        // Fall back to store data
        const storeCoins = this.gameStore.coinsThisSession();
        const storeCorrect = this.gameStore.correctCount();
        const storeTotal = this.gameStore.totalQuestions();

        const fallback: Session = {
          id: sessionId,
          playerId: '',
          mathModule: 'percentages',
          difficultyLevel: 'class5',
          status: 'completed',
          totalQuestions: storeTotal,
          questionsAnswered: storeTotal,
          correctCount: storeCorrect,
          coinsEarned: storeCoins,
          startedAt: new Date().toISOString(),
        };
        this.session.set(fallback);
      },
    });
  }

  playAgain(): void {
    this.gameStore.reset();
    void this.router.navigate(['/difficulty']);
  }
}
