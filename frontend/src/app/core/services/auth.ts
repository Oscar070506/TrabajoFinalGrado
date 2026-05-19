import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = 'http://localhost:8001/api';

  constructor(private http: HttpClient, private router: Router) {}

  register(data: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.API}/register`, data).pipe(
      tap((res: any) => this.saveSession(res))
    );
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.API}/login`, data).pipe(
      tap((res: any) => this.saveSession(res))
    );
  }

  private saveSession(res: any): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUser(): any {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}