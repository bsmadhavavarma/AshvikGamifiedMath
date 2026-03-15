import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface User { id: string; fullName: string; displayName: string; level: number; createdAt: string; }

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
  private api = inject(ApiService);
  users = signal<User[]>([]);
  error = signal('');

  // Create form
  showCreateForm = signal(false);
  createForm = { fullName: '', displayName: '', level: 6, pin: '' };
  createdPin = signal('');

  // Edit modal
  editingUser = signal<User | null>(null);
  editForm = { fullName: '', displayName: '', level: 1, pin: '' };
  editResultPin = signal('');

  // Delete confirm
  deletingUser = signal<User | null>(null);

  levels = [1,2,3,4,5,6,7,8,9,10,11,12];

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.api.get<{ users: User[] }>('/admin/users').subscribe({
      next: r => this.users.set(r.data.users),
      error: () => this.error.set('Admin access only available from localhost'),
    });
  }

  // ── Create ────────────────────────────────────────────────────
  createUser() {
    this.api.post<{ user: User; pin: string }>('/admin/users', {
      fullName: this.createForm.fullName,
      displayName: this.createForm.displayName,
      level: +this.createForm.level,
      pin: this.createForm.pin || undefined,
    }).subscribe({
      next: r => {
        this.createdPin.set(r.data.pin);
        this.showCreateForm.set(false);
        this.createForm = { fullName: '', displayName: '', level: 6, pin: '' };
        this.loadUsers();
      },
      error: err => this.error.set(err?.error?.error?.message ?? 'Failed to create user'),
    });
  }

  // ── Edit ──────────────────────────────────────────────────────
  openEdit(user: User) {
    this.editForm = { fullName: user.fullName, displayName: user.displayName, level: user.level, pin: '' };
    this.editResultPin.set('');
    this.editingUser.set(user);
  }

  saveEdit() {
    const user = this.editingUser();
    if (!user) return;
    const body: Record<string, unknown> = {
      fullName: this.editForm.fullName,
      displayName: this.editForm.displayName,
      level: +this.editForm.level,
    };
    // empty string → auto-generate; absent → don't change pin
    if (this.editForm.pin !== null) body['pin'] = this.editForm.pin;

    this.api.patch<{ user: User; pin?: string }>(`/admin/users/${user.id}`, body).subscribe({
      next: r => {
        if (r.data.pin) this.editResultPin.set(r.data.pin);
        else this.editingUser.set(null);
        this.loadUsers();
      },
      error: err => this.error.set(err?.error?.error?.message ?? 'Failed to update user'),
    });
  }

  closeEdit() { this.editingUser.set(null); this.editResultPin.set(''); }

  // ── Delete ────────────────────────────────────────────────────
  confirmDelete(user: User) { this.deletingUser.set(user); }

  doDelete() {
    const user = this.deletingUser();
    if (!user) return;
    this.api.delete(`/admin/users/${user.id}`).subscribe({
      next: () => { this.deletingUser.set(null); this.loadUsers(); },
      error: err => this.error.set(err?.error?.error?.message ?? 'Failed to delete user'),
    });
  }
}
