import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';

export interface User { id: string; fullName: string; displayName: string; level: number; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  currentUser = signal<User | null>(null);

  constructor() {
    const stored = localStorage.getItem('user');
    if (stored) this.currentUser.set(JSON.parse(stored));
  }

  login(displayName: string, pin: string) {
    return this.api.post<{ user: User }>('/auth/login', { displayName, pin }).pipe(
      tap(res => {
        this.currentUser.set(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('userId', res.data.user.id);
      })
    );
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  }

  updateLevel(level: number) {
    const user = this.currentUser();
    if (user) {
      const updated = { ...user, level };
      this.currentUser.set(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  }

  isLoggedIn(): boolean { return this.currentUser() !== null; }
}
