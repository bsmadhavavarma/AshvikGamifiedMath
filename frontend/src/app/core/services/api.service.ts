import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://localhost:3001/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private headers(): HttpHeaders {
    const userId = localStorage.getItem('userId');
    return userId ? new HttpHeaders({ 'x-user-id': userId }) : new HttpHeaders();
  }

  get<T>(path: string): Observable<{ success: boolean; data: T }> {
    return this.http.get<{ success: boolean; data: T }>(`${API_BASE}${path}`, { headers: this.headers() });
  }

  post<T>(path: string, body: unknown): Observable<{ success: boolean; data: T }> {
    return this.http.post<{ success: boolean; data: T }>(`${API_BASE}${path}`, body, { headers: this.headers() });
  }

  patch<T>(path: string, body: unknown): Observable<{ success: boolean; data: T }> {
    return this.http.patch<{ success: boolean; data: T }>(`${API_BASE}${path}`, body, { headers: this.headers() });
  }

  delete<T>(path: string): Observable<{ success: boolean; data: T }> {
    return this.http.delete<{ success: boolean; data: T }>(`${API_BASE}${path}`, { headers: this.headers() });
  }
}
