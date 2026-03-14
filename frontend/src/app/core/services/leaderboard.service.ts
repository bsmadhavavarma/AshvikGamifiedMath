import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { ApiService, ApiPaginatedResponse } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private api = inject(ApiService);

  getLeaderboard(limit = 10): Observable<ApiPaginatedResponse<LeaderboardEntry>> {
    return this.api.getPaginated<LeaderboardEntry>('/leaderboard', {
      page: 1,
      pageSize: limit,
    });
  }

  getPlayerRank(playerId: string): Observable<LeaderboardEntry> {
    return this.api.get<LeaderboardEntry>(`/leaderboard/me/${playerId}`);
  }
}
