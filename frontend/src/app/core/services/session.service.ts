import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Session, CreateSessionDto } from '../models/session.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private api = inject(ApiService);

  createSession(dto: CreateSessionDto): Observable<Session> {
    return this.api.post<Session>('/sessions', dto);
  }

  getSession(sessionId: string): Observable<Session> {
    return this.api.get<Session>(`/sessions/${sessionId}`);
  }

  abandonSession(sessionId: string): Observable<Session> {
    return this.api.patch<Session>(`/sessions/${sessionId}/abandon`, {});
  }
}
