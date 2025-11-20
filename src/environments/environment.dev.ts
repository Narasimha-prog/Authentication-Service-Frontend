export const environment_dev = {
     production: false,

  oauth: {
    client_id: "web-client",
    issuer: "http://localhost:7878",
    redirect_uri: "http://localhost:4000/auth/callback",
    scopes: "openid profile email",
    authorize_url: "http://localhost:7878/oauth2/authorize",
  }
}