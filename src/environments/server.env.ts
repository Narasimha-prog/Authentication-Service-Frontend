export const serverEnvironment = {
  oauth: {
    client_id: "web-client",
    client_secret: "lnreddy",

    token_url: "http://localhost:7878/oauth2/token",

    grant_type: "authorization_code",
    redirect_uri: "http://localhost:4000/auth/callback",
    scopes: "openid profile email"
,    issuer: "http://localhost:7878"
  }
};
