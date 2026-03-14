import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
})
export class StarRatingComponent {
  private _accuracy = signal(0);

  @Input()
  set accuracy(value: number) {
    this._accuracy.set(value);
  }
  get accuracy(): number {
    return this._accuracy();
  }

  readonly starCount = computed(() => {
    const acc = this._accuracy();
    if (acc >= 90) return 3;
    if (acc >= 70) return 2;
    if (acc >= 50) return 1;
    return 0;
  });

  readonly stars = computed(() => {
    const count = this.starCount();
    return [
      { filled: count >= 1, index: 0 },
      { filled: count >= 2, index: 1 },
      { filled: count >= 3, index: 2 },
    ];
  });

  readonly message = computed(() => {
    const count = this.starCount();
    switch (count) {
      case 3: return 'Excellent! Perfect score!';
      case 2: return 'Great job! Keep it up!';
      case 1: return 'Good effort! Practice more!';
      default: return 'Keep practicing! You can do it!';
    }
  });
}
