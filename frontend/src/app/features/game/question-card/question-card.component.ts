import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../../core/models/question.model';

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-card.component.html',
  styleUrl: './question-card.component.scss',
})
export class QuestionCardComponent {
  @Input() question: Question | null = null;
  @Input() questionNumber = 1;
  @Input() totalQuestions = 10;
}
