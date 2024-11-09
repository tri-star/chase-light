import { validateToken } from "nuxt-oidc-auth/runtime/server/utils/security.js"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  modules: ["@nuxt/eslint", "@pinia/nuxt", "nuxt-auth-utils"],
  plugins: [],
  runtimeConfig: {
    oauth: {
      auth0: {
        domain: process.env.NUXT_OAUTH_AUTH0_DOMAIN,
        clientId: process.env.NUXT_OAUTH_AUTH0_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_AUTH0_CLIENT_SECRET,
        redirectURL: process.env.NUXT_OAUTH_AUTH0_REDIRECT_URL,
        audience: process.env.NUXT_OAUTH_AUTH0_AUDIENCE,
      },
    },
    public: {
      auth0: {
        domain: process.env.NUXT_PUBLIC_OAUTH_AUTH0_DOMAIN,
        clientId: process.env.NUXT_PUBLIC_OAUTH_AUTH0_CLIENT_ID,
        redirectUrl: process.env.NUXT_PUBLIC_OAUTH_AUTH0_REDIRECT_URL,
      },
    },
  },
})
