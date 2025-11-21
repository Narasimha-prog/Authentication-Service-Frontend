// server/server.ts

import express from 'express';
import session from 'express-session';
import { Issuer } from 'openid-client';
import { join } from 'path';
import axios from "axios";
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
    client_id: serverEnvironment.oauth.client_id,
    redirect_uri: serverEnvironment.oauth.redirect_uri,
    response_type: 'code',
  });

  res.redirect(url);
});

// -------------------- CALLBACK --------------------

app.get("/auth/callback", async (req, res) => {
  try {
    const rawCode = req.query["code"];

    // Validate type
    if (typeof rawCode !== "string") {
      return res.status(400).send("Invalid authorization code");
    }

    const code: string = rawCode;

    const token = await exchangeAuthCodeForToken(code);

    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});



async function exchangeAuthCodeForToken(code: string) {
  const tokenUrl = `${serverEnvironment.oauth.issuer}/oauth2/token`;

  try {
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: serverEnvironment.oauth.redirect_uri
       
      })
      ,{
        auth: {
          username: serverEnvironment.oauth.client_id,
          password: serverEnvironment.oauth.client_secret,
        },
      
    
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data; // access_token, id_token, refresh_token…
  } catch (err: any) {
    console.error("❌ Token exchange error:", err.response?.data || err);
    throw err;
  }
}



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



