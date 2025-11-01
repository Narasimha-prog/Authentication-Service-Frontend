import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);

  constructor(private oauthService: OAuthService) {}

  async initAuth(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      console.log('Browser: Initializing real OAuth flow...');
      try {
        await this.oauthService.loadDiscoveryDocumentAndTryLogin();
        console.log('OAuth initialized in browser');
      } catch (err) {
        console.error('Error loading discovery document:', err);
      }
    } else {
      console.log('SSR: using dummy auth data');
      // Use placeholder or skip login logic
    }
  }
}
