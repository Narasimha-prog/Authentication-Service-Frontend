// server/server.ts

import express from 'express';
import session from 'express-session';
import { Issuer } from 'openid-client';
import { join } from 'path';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
} from '@angular/ssr/node';

import { serverEnvironment } from '../src/environments/server.env';

declare module 'express-session' {
  interface SessionData {
    token?: unknown;
    user?: Record<string, any> | null;
  }
}

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
  scope: serverEnvironment.oauth.scopes,
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

app.get("/auth/callback", async (req, res) => {
  try {
    const code = req.query['code'] as string;

    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    const tokenPayload = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: serverEnvironment.oauth.redirect_uri,
      client_id: serverEnvironment.oauth.client_id,
      client_secret: serverEnvironment.oauth.client_secret
    });

    const tokenResponse = await fetch(`${serverEnvironment.oauth.issuer}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenPayload
    });

    const tokenSet = await tokenResponse.json();

    // Decode user info
    const user = parseJwt(tokenSet.id_token);

    req.session.user = user;
    req.session.tokenSet = tokenSet;

    console.log("Logged in user:", user);

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("OAuth callback failed");
  }
});

function parseJwt(token: string) {
  const base64 = token.split('.')[1];
  const json = Buffer.from(base64, "base64").toString("utf8");
  return JSON.parse(json);
}




// -------------------- LOGOUT --------------------

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// -------------------- API --------------------

app.get('/api/me', (req, res):any => {
  if (!req.session.user) 
    return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

// Static files
app.use(express.static(browserDistFolder, { maxAge: '1y', index: false }));

// -------------------- SSR HANDLER (CORRECT WAY) --------------------
app.use(
  createNodeRequestHandler((req, res, next) => {
    angularApp
      .handle(req, res)
      .then(() => {
        // SSR completed by Angular engine
      })
      .catch(next);
  })
);

// Export for Vite/Angular dev server
export const reqHandler = app;





// Start server
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`🚀 Angular SSR + OIDC server running on http://localhost:${port}`);
  });
}



