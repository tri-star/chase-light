import { validateToken } from "nuxt-oidc-auth/runtime/server/utils/security.js"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  modules: [
    "@nuxt/eslint",
    "@pinia/nuxt",
    "nuxt-auth-utils",
    "@nuxtjs/storybook",
    "@nuxtjs/tailwindcss",
    "@nuxt/icon",
  ],
  components: {
    dirs: [],
  },
  plugins: [],
  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap",
        },
      ],
    },
  },
  runtimeConfig: {
    apiHost: process.env.NUXT_API_HOST,
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
      apiHost: process.env.NUXT_PUBLIC_API_HOST,
      auth0: {
        domain: process.env.NUXT_PUBLIC_OAUTH_AUTH0_DOMAIN,
        clientId: process.env.NUXT_PUBLIC_OAUTH_AUTH0_CLIENT_ID,
        redirectUrl: process.env.NUXT_PUBLIC_OAUTH_AUTH0_REDIRECT_URL,
        audience: process.env.NUXT_PUBLIC_OAUTH_AUTH0_AUDIENCE,
      },
    },
  },
  // 現時点では以下のワークアラウンドが必要
  // https://github.com/nuxt-modules/storybook/issues/776#issuecomment-2434672219
  vite: {
    optimizeDeps: {
      include: [
        "eslint-plugin-regexp > jsdoc-type-pratt-parser",
        "storybook > @storybook/core > jsdoc-type-pratt-parser",
      ],
    },
  },
})
