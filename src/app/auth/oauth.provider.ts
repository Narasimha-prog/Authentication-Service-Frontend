import { EnvironmentProviders, makeEnvironmentProviders, inject, PLATFORM_ID, APP_INITIALIZER } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService, AuthConfig, OAuthModule } from 'angular-oauth2-oidc';

export function provideOAuthClient(): EnvironmentProviders {
  return makeEnvironmentProviders([
    OAuthModule.forRoot().providers!,
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const oauthService = inject(OAuthService);
        const platformId = inject(PLATFORM_ID);
// ✅ Only access `window` when running in the browser
        const redirectUri = isPlatformBrowser(platformId)
          ? window.location.origin + '/login/oauth2/code/web-client'
          : 'http://127.0.0.1:8080/login/oauth2/code/web-client';

        const authConfig: AuthConfig = {
          issuer: 'http://localhost:7878',
          redirectUri,
          clientId: 'web-client',
          responseType: 'code',
          scope: 'openid profile email',
          showDebugInformation: true,
          useSilentRefresh: false,
        };
        // APP_INITIALIZER expects a function returning a Promise or void
        return () => {
          oauthService.configure(authConfig);
          return oauthService.loadDiscoveryDocumentAndTryLogin();
        };
      },
      multi: true,
    },
  ]);
}
