import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Player } from '../models/player.model';
import { ApiService } from './api.service';

const PLAYER_STORAGE_KEY = 'ashvik_player';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private api = inject(ApiService);

  private _player = signal<Player | null>(null);

  readonly player = this._player.asReadonly();
  readonly isLoggedIn = computed(() => this._player() !== null);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(PLAYER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Player;
        this._player.set(parsed);
      }
    } catch {
      localStorage.removeItem(PLAYER_STORAGE_KEY);
    }
  }

  createPlayer(displayName: string, avatarCode: string): Observable<Player> {
    return this.api
      .post<Player>('/players', { displayName, avatarCode })
      .pipe(
        tap((player) => {
          this._player.set(player);
          localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
        }),
      );
  }

  refreshPlayer(): Observable<Player> {
    const current = this._player();
    if (!current) {
      throw new Error('No player logged in');
    }
    return this.api.get<Player>(`/players/${current.id}`).pipe(
      tap((player) => {
        this._player.set(player);
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
      }),
    );
  }

  updateLocalPlayer(updates: Partial<Player>): void {
    const current = this._player();
    if (current) {
      const updated = { ...current, ...updates };
      this._player.set(updated);
      localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(updated));
    }
  }

  logout(): void {
    this._player.set(null);
    localStorage.removeItem(PLAYER_STORAGE_KEY);
  }
}
