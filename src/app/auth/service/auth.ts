import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({ providedIn: 'root' })
export class AuthService {
  
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private oauthService: OAuthService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  } 

  async initAuth(): Promise<void> {
    if (this.isBrowser) {
      console.log('Browser: Initializing real OAuth flow...');
      try {
        await this.oauthService.loadDiscoveryDocumentAndTryLogin();
        console.log('OAuth initialized in browser');
      } catch (err) {
        console.error('Error loading discovery document:', err);
      }
    } else {
      console.log('SSR: using dummy auth data');
    }
  }
}
