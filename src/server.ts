// server/server.ts

import express from 'express';
import session from 'express-session';
const openid: any = await import('openid-client');
const { Issuer, generators } = openid;



import { join } from 'path';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
} from '@angular/ssr/node';

import { serverEnvironment } from '../src/environments/server.env';

// Angular SSR setup
const app = express();
const angularApp = new AngularNodeAppEngine();
const browserDistFolder = join(import.meta.dirname, '../browser');

// Express session
app.use(session({
  secret: 'super-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, sameSite: 'lax' },
}));

// Discover issuer dynamically from your Spring Authorization Server
const oidcIssuer = await Issuer.discover(`${serverEnvironment.oauth.issuer}/.well-known/openid-configuration`);

const client = new oidcIssuer.Client({
  client_id: serverEnvironment.oauth.client_id,
  client_secret: serverEnvironment.oauth.client_secret,
  redirect_uris: [serverEnvironment.oauth.redirect_uri],
  response_types: ['code'],
});

// -------------------- LOGIN --------------------

app.get('/login', (req, res) => {
  const url = client.authorizationUrl({
    scope: serverEnvironment.oauth.scopes,
  });

  res.redirect(url);
});

// -------------------- CALLBACK --------------------

app.get('/callback', async (req, res, next) => {
  try {
    const params = client.callbackParams(req);

    const tokenSet = await client.callback(
      serverEnvironment.oauth.redirect_uri,
      params
    );

    req.session.user = tokenSet.claims();
    req.session.tokenSet = tokenSet;

    console.log('✅ Logged in user:', req.session.user);

    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// -------------------- LOGOUT --------------------

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// -------------------- API --------------------

app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

// Static files
app.use(express.static(browserDistFolder, { maxAge: '1y', index: false }));

// SSR handler
app.use(createNodeRequestHandler(app));

// Start server
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`🚀 Angular SSR + OIDC server running on http://localhost:${port}`);
  });
}
