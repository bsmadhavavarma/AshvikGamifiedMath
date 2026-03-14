import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnswerFeedback } from '../../../core/models/answer.model';

@Component({
  selector: 'app-feedback-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback-overlay.component.html',
  styleUrl: './feedback-overlay.component.scss',
})
export class FeedbackOverlayComponent {
  @Input() feedback: AnswerFeedback | null = null;
  @Input() visible = false;
}
