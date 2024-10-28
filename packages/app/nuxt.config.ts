import { validateToken } from "nuxt-oidc-auth/runtime/server/utils/security.js"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },
  modules: ["@nuxt/eslint", "@pinia/nuxt", "nuxt-oidc-auth"],
  plugins: [],
  oidc: {
    providers: {
      auth0: {
        // authenticationScheme: "body",
        audience: "http://localhost:3000",
        redirectUri: "http://localhost:3000/auth/auth0/callback",
        baseUrl: "https://dev-bb54655koyekbf6p.jp.auth0.com",
        clientId: "",
        clientSecret: "",
        skipAccessTokenParsing: true,
        exposeIdToken: true,
        // validateAccessToken: false,
        scope: ["openid", "profile", "email"],
        additionalAuthParameters: {
          // In case you need access to an API registered in Auth0
        },
        additionalTokenParameters: {
          // In case you need access to an API registered in Auth0
        },
      },
    },
  },
  runtimeConfig: {
    public: {
      auth0Domain: process.env.NUXT_PUBLIC_AUTH0_DOMAIN,
      auth0ClientId: process.env.NUXT_PUBLIC_AUTH0_CLIENT_ID,
      auth0RedirectUri: process.env.NUXT_PUBLIC_AUTH0_REDIRECT_URI,
    },
  },
})
