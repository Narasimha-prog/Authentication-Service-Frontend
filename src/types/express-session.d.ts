import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: Record<string, any>;      // the user claims
    tokenSet?: any;                  // token set returned by openid-client
  }
}