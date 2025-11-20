import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  getUser(): Observable<any> {
    return this.http.get('/api/me'); // server returns user info if logged in
  }

  login(): void {
    window.location.href = '/login'; // server handles OAuth redirect
  }

  logout(): void {
    window.location.href = '/logout'; // server destroys session
  }
}
