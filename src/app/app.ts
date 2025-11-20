import { CommonModule } from '@angular/common';
import { Component, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/service/auth';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  title = signal('auth_service_frontend');

  // User signal, initially null
  user = signal<any | null>(null);

  constructor(private authService: AuthService) {
    // Fetch current user from server on load
    this.loadUser();
  }

  async loadUser() {
    try {
      const user = await this.authService.getUser().toPromise();
      this.user.set(user);
    } catch {
      this.user.set(null);
    }
  }

  login() {
    this.authService.login(); // redirects to server login
  }

  logout() {
    this.authService.logout(); // redirects to server logout
  }
}
