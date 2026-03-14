import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coin-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coin-counter.component.html',
  styleUrl: './coin-counter.component.scss',
})
export class CoinCounterComponent implements OnChanges {
  @Input() coins = 0;

  protected _displayCoins = signal(0);
  protected _popDelta = signal(0);
  protected _showPop = signal(false);

  private popTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['coins']) {
      const prev = changes['coins'].previousValue as number ?? 0;
      const curr = changes['coins'].currentValue as number ?? 0;
      const delta = curr - prev;

      if (delta > 0) {
        this._popDelta.set(delta);
        this._showPop.set(true);

        if (this.popTimeout) {
          clearTimeout(this.popTimeout);
        }
        this.popTimeout = setTimeout(() => {
          this._showPop.set(false);
        }, 1200);
      }

      this._displayCoins.set(curr);
    }
  }
}
