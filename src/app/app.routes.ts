import { Routes } from '@angular/router';
import { AuthCallbackComponent } from './app/auth/auth-callback/auth-callback';

export const routes: Routes = [
    { path: 'login/oauth2/code/web-client', component: AuthCallbackComponent },
];
