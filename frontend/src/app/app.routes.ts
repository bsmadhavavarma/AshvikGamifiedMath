import { Routes } from '@angular/router';
import { sessionGuard } from './core/guards/session.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'difficulty',
    loadComponent: () =>
      import('./features/difficulty-select/difficulty-select.component').then(
        (m) => m.DifficultySelectComponent,
      ),
    canActivate: [sessionGuard],
  },
  {
    path: 'game/:sessionId',
    loadComponent: () =>
      import('./features/game/game.component').then((m) => m.GameComponent),
    canActivate: [sessionGuard],
  },
  {
    path: 'results/:sessionId',
    loadComponent: () =>
      import('./features/results/results.component').then(
        (m) => m.ResultsComponent,
      ),
    canActivate: [sessionGuard],
  },
  {
    path: 'leaderboard',
    loadComponent: () =>
      import('./features/leaderboard/leaderboard.component').then(
        (m) => m.LeaderboardComponent,
      ),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then(
        (m) => m.HistoryComponent,
      ),
    canActivate: [sessionGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
