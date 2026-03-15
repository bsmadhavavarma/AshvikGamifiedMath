import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  displayName = signal('');
  pin = signal('');
  error = signal('');
  loading = signal(false);

  login() {
    if (!this.displayName() || this.pin().length !== 6) {
      this.error.set('Enter your name and 6-digit PIN');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.displayName(), this.pin()).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.error.set(err?.error?.error?.message ?? 'Invalid name or PIN');
        this.loading.set(false);
      },
    });
  }
}
