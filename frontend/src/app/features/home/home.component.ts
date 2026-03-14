import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';

const AVATARS = [
  { code: '🦁', label: 'Lion' },
  { code: '🐯', label: 'Tiger' },
  { code: '🦊', label: 'Fox' },
  { code: '🐻', label: 'Bear' },
  { code: '🐼', label: 'Panda' },
  { code: '🐨', label: 'Koala' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private playerService = inject(PlayerService);
  private router = inject(Router);

  protected avatars = AVATARS;
  protected displayName = signal('');
  protected selectedAvatar = signal(AVATARS[0].code);
  protected isLoading = signal(false);
  protected errorMessage = signal('');

  get nameValue(): string {
    return this.displayName();
  }

  set nameValue(val: string) {
    this.displayName.set(val);
    this.errorMessage.set('');
  }

  selectAvatar(code: string): void {
    this.selectedAvatar.set(code);
  }

  onSubmit(): void {
    const name = this.displayName().trim();

    if (!name) {
      this.errorMessage.set('Please enter your name!');
      return;
    }

    if (name.length < 2) {
      this.errorMessage.set('Name must be at least 2 characters!');
      return;
    }

    if (name.length > 20) {
      this.errorMessage.set('Name must be 20 characters or less!');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.playerService.createPlayer(name, this.selectedAvatar()).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.router.navigate(['/difficulty']);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const message =
          err instanceof Error ? err.message : 'Failed to create player. Please try again!';
        this.errorMessage.set(message);
      },
    });
  }
}
