// const isBuild = process.env.NODE_ENV === 'production'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    'nuxt-auth-utils',
    '@nuxtjs/storybook',
    '@nuxtjs/tailwindcss',
    '@nuxt/test-utils/module',
    '@nuxt/icon',
  ],
  srcDir: 'src',
  components: {
    dirs: [],
  },
  plugins: ['~/plugins/zod', '~/plugins/a3-fetch'],
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap',
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
    // resolve: isBuild
    //   ? undefined
    //   : {
    //       alias: {
    //         vue: 'vue/dist/vue.esm-bundler.js',
    //       },
    //     },
    optimizeDeps: {
      include: [
        'eslint-plugin-regexp > jsdoc-type-pratt-parser',
        // 'storybook > @storybook/core > jsdoc-type-pratt-parser',
      ],
    },
  },
  optimization: {
    keyedComposables: [
      {
        name: 'useA3Fetch',
        argumentLength: 3,
      },
    ],
  },
  icon: {
    // FIXME: 出来ればStorybook経由の時だけこの形にしたい
    localApiEndpoint: 'https://api.iconify.design',
  },
})
