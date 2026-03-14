import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SubmitAnswerDto, AnswerFeedback } from '../models/answer.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AnswerService {
  private api = inject(ApiService);

  submitAnswer(
    sessionId: string,
    questionId: string,
    dto: SubmitAnswerDto,
  ): Observable<AnswerFeedback> {
    return this.api.post<AnswerFeedback>(
      `/sessions/${sessionId}/questions/${questionId}/answer`,
      dto,
    );
  }
}
