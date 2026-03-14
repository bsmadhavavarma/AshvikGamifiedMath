import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStore } from '../../../state/game.store';
import { CoinCounterComponent } from '../../../shared/components/coin-counter/coin-counter.component';

@Component({
  selector: 'app-score-hud',
  standalone: true,
  imports: [CommonModule, CoinCounterComponent],
  templateUrl: './score-hud.component.html',
  styleUrl: './score-hud.component.scss',
})
export class ScoreHudComponent {
  protected gameStore = inject(GameStore);
}
