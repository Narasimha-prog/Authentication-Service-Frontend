// server/server.ts

import express from 'express';
import session from 'express-session';
import { Issuer, generators } from 'openid-client';
import { join } from 'path';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
} from '@angular/ssr/node';

// Angular SSR setup
const app = express();
const angularApp = new AngularNodeAppEngine();
const browserDistFolder = join(import.meta.dirname, '../browser');

// ✅ Express session (use Redis or DB in production)
app.use(session({
  secret: 'super-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, sameSite: 'lax' }, // secure: true in prod
}));

// ✅ OIDC configuration
const oidcIssuer = await Issuer.discover('https://your-idp-domain/.well-known/openid-configuration');
const client = new oidcIssuer.Client({
  client_id: 'angular-ssr-client',
  client_secret: 'YOUR_CLIENT_SECRET',
  redirect_uris: ['http://localhost:4000/callback'],
  response_types: ['code'],
});

// Helper to build login URL
const code_verifier = generators.codeVerifier();
const code_challenge = generators.codeChallenge(code_verifier);

// ✅ Login endpoint
app.get('/login', (req, res) => {
  req.session.code_verifier = code_verifier;
  const url = client.authorizationUrl({
    scope: 'openid profile email',
    code_challenge,
    code_challenge_method: 'S256',
  });
  res.redirect(url);
});

// ✅ Callback from OIDC provider
app.get('/callback', async (req, res, next) => {
  try {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(
      'http://localhost:4000/callback',
      params,
      { code_verifier: req.session.code_verifier }
    );

    // Save user info in session
    req.session.user = tokenSet.claims();
    req.session.tokenSet = tokenSet;
    console.log('✅ Logged in user:', req.session.user);

    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// ✅ Logout endpoint
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ✅ Example API endpoint
app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

// ✅ Serve static files (for assets)
app.use(express.static(browserDistFolder, { maxAge: '1y', index: false }));

// ✅ SSR handling (all other routes)
app.use(createNodeRequestHandler(app));

// ✅ Start the server
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`🚀 Angular SSR + OIDC server running on http://localhost:${port}`);
  });
}
