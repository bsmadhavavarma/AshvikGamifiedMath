import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-timer-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer-bar.component.html',
  styleUrl: './timer-bar.component.scss',
})
export class TimerBarComponent implements OnChanges, OnDestroy {
  @Input() durationMs = 15000;
  @Input() active = false;
  @Output() timerExpired = new EventEmitter<void>();

  private _elapsed = signal(0);
  private subscription: Subscription | null = null;
  private startTime: number | null = null;

  readonly percentRemaining = computed(() => {
    const pct = Math.max(0, 100 - (this._elapsed() / this.durationMs) * 100);
    return pct;
  });

  readonly colorClass = computed(() => {
    const pct = this.percentRemaining();
    if (pct > 60) return 'green';
    if (pct > 30) return 'yellow';
    return 'red';
  });

  readonly secondsRemaining = computed(() => {
    const ms = Math.max(0, this.durationMs - this._elapsed());
    return Math.ceil(ms / 1000);
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['active'] || changes['durationMs']) {
      if (this.active) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this._elapsed.set(0);
    this.startTime = Date.now();

    this.subscription = interval(50)
      .pipe(takeWhile(() => this._elapsed() < this.durationMs))
      .subscribe(() => {
        const elapsed = Date.now() - (this.startTime ?? Date.now());
        this._elapsed.set(elapsed);

        if (elapsed >= this.durationMs) {
          this._elapsed.set(this.durationMs);
          this.timerExpired.emit();
          this.stopTimer();
        }
      });
  }

  private stopTimer(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}
