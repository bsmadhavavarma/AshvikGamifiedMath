import { Injectable, inject, computed } from '@angular/core';
import { PlayerService } from '../core/services/player.service';

/**
 * PlayerStore wraps PlayerService signals for convenient use in components.
 * Provides computed properties derived from the player signal.
 */
@Injectable({
  providedIn: 'root',
})
export class PlayerStore {
  private playerService = inject(PlayerService);

  readonly player = this.playerService.player;
  readonly isLoggedIn = this.playerService.isLoggedIn;

  readonly displayName = computed(() => this.playerService.player()?.displayName ?? '');
  readonly avatarCode = computed(() => this.playerService.player()?.avatarCode ?? '');
  readonly totalCoins = computed(() => this.playerService.player()?.totalCoins ?? 0);
  readonly currentStreak = computed(() => this.playerService.player()?.currentStreak ?? 0);
  readonly longestStreak = computed(() => this.playerService.player()?.longestStreak ?? 0);
  readonly playerId = computed(() => this.playerService.player()?.id ?? '');
}
