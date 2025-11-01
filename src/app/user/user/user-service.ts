import { Injectable } from '@angular/core';
import { PlatformService } from '../../platform-service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private platform: PlatformService) {}

  getUserProfile() {
    if (this.platform.isBrowser()) {
      // 🌐 Real API call
      return fetch('/api/user').then(r => r.json());
    } else {
      // 🧱 Dummy placeholder for SSR
      return Promise.resolve({
        name: 'SSR Placeholder',
        role: 'guest',
      });
    }
  }
}
