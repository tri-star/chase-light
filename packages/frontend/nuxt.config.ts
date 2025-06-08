// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/test-utils',
    '@nuxt/test-utils/module',
    '@nuxtjs/tailwindcss',
    'nuxt-auth-utils',
    '@nuxtjs/storybook',
  ],
  runtimeConfig: {
    // Public keys (exposed to client-side)
    public: {
      auth0Domain: process.env.NUXT_AUTH0_DOMAIN,
      auth0ClientId: process.env.NUXT_AUTH0_CLIENT_ID,
    }
  }
});
