import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-observability',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './observability.component.html',
  styleUrls: ['./observability.component.scss'],
})
export class ObservabilityComponent implements OnInit {
  private api = inject(ApiService);
  health = signal<Record<string, unknown> | null>(null);
  apiUsage = signal<Record<string, unknown> | null>(null);
  cache = signal<Record<string, unknown> | null>(null);
  error = signal('');

  ngOnInit() { this.load(); }

  load() {
    this.api.get<Record<string, unknown>>('/observability/health').subscribe({ next: r => this.health.set(r.data), error: () => this.error.set('Admin only — access from localhost') });
    this.api.get<Record<string, unknown>>('/observability/api-usage').subscribe({ next: r => this.apiUsage.set(r.data) });
    this.api.get<Record<string, unknown>>('/observability/cache').subscribe({ next: r => this.cache.set(r.data) });
  }
}
