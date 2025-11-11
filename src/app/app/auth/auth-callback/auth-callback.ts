import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="callback-container">
      <p>Processing sign-in...</p>
    </div>
  `,
  styleUrls: ['./auth-callback.scss'],
})
export class AuthCallbackComponent implements OnInit {
  constructor(private oauthService: OAuthService, private router: Router) {}

  async ngOnInit() {
    try {
      const result = await this.oauthService.tryLoginCodeFlow();

      if (this.oauthService.hasValidAccessToken()) {
        console.log('✅ Login successful, redirecting to dashboard...');
        this.router.navigate(['/']); // Change to your main route
      } else {
        console.warn('⚠️ No valid token found after callback.');
        this.router.navigate(['/login']); // Or show error
      }
    } catch (e) {
      console.error('OAuth callback error:', e);
      this.router.navigate(['/login']);
    }
  }
}
