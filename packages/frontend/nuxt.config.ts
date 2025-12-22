// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  devServer: {
    port: parseInt(process.env.FRONTEND_PORT || '3000'),
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/test-utils',
    '@nuxt/test-utils/module',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/storybook',
    '@pinia/nuxt',
  ],
  runtimeConfig: {
    // Private keys (only available on the server-side)
    useAws: process.env.NUXT_USE_AWS === 'true',
    appStage: process.env.APP_STAGE,
    secretId: process.env.SECRET_ID,
    auth0Domain: process.env.AUTH0_DOMAIN,
    auth0ClientId: process.env.AUTH0_CLIENT_ID,
    auth0ClientSecret: process.env.AUTH0_CLIENT_SECRET,
    auth0Audience: process.env.AUTH0_AUDIENCE,
    sessionSecret: process.env.NUXT_SESSION_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    // Public keys (exposed to the client-side)
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    },
  },
  ssr: true, // SSR認証のために必須
  nitro: {
    experimental: {
      wasm: true,
      asyncContext: true,
    },
  },
  typescript: {
    typeCheck: true, // ビルド時の型チェックを有効化
    strict: true,
  },
  storybook: {
    enabled: false, // 開発サーバーとの同時起動はエラーが起きるので停止
  },
  sourcemap: { client: 'hidden', server: true },
})
