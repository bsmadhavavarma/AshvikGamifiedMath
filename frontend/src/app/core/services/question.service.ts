import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Question } from '../models/question.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private api = inject(ApiService);

  getQuestion(sessionId: string, sequenceNumber: number): Observable<Question> {
    return this.api.get<Question>(
      `/sessions/${sessionId}/questions/${sequenceNumber}`,
    );
  }
}
