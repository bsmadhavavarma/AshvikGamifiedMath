import {
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-answer-options',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './answer-options.component.html',
  styleUrl: './answer-options.component.scss',
})
export class AnswerOptionsComponent {
  @Input() options: string[] = [];
  @Input() disabled = false;
  @Input() correctOption: string | null = null;
  @Input() selectedOption: string | null = null;
  @Output() optionSelected = new EventEmitter<string>();

  readonly optionLabels = ['A', 'B', 'C', 'D'];

  selectOption(option: string): void {
    if (this.disabled) return;
    this.optionSelected.emit(option);
  }

  getOptionState(option: string): 'correct' | 'wrong' | 'default' | 'selected' {
    if (this.correctOption !== null) {
      if (option === this.correctOption) return 'correct';
      if (option === this.selectedOption && option !== this.correctOption) return 'wrong';
      return 'default';
    }
    if (option === this.selectedOption) return 'selected';
    return 'default';
  }
}
