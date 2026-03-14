import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private apiBase = environment.apiBaseUrl;

  get<T>(path: string, params?: Record<string, string | number>): Observable<T> {
    const options = params
      ? {
          params: Object.fromEntries(
            Object.entries(params).map(([k, v]) => [k, String(v)]),
          ),
        }
      : {};
    return this.http
      .get<ApiResponse<T>>(`${this.apiBase}${path}`, options)
      .pipe(map((res) => res.data));
  }

  getPaginated<T>(
    path: string,
    params?: Record<string, string | number>,
  ): Observable<ApiPaginatedResponse<T>> {
    const options = params
      ? {
          params: Object.fromEntries(
            Object.entries(params).map(([k, v]) => [k, String(v)]),
          ),
        }
      : {};
    return this.http.get<ApiPaginatedResponse<T>>(`${this.apiBase}${path}`, options);
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.apiBase}${path}`, body)
      .pipe(map((res) => res.data));
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.apiBase}${path}`, body)
      .pipe(map((res) => res.data));
  }
}
