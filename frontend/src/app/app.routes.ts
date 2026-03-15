import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  { path: 'home', canActivate: [authGuard], loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'learn/:theme/:level/:subject/:chapter', canActivate: [authGuard], loadComponent: () => import('./features/learn/learn.component').then(m => m.LearnComponent) },
  { path: 'evaluate/:theme/:level/:subject/:chapter', canActivate: [authGuard], loadComponent: () => import('./features/evaluate/evaluate.component').then(m => m.EvaluateComponent) },
  { path: 'progress', canActivate: [authGuard], loadComponent: () => import('./features/progress/progress.component').then(m => m.ProgressComponent) },
  { path: 'admin', loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent) },
  { path: 'admin/observability', loadComponent: () => import('./features/admin/observability/observability.component').then(m => m.ObservabilityComponent) },
  { path: '**', redirectTo: 'login' },
];
