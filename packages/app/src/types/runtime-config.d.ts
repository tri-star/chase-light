declare module 'nuxt/schema' {
  interface RuntimeConfig {
    appHost: string
  }
  interface PublicRuntimeConfig {
    apiHost: string
    auth0: {
      domain: string
      clientId: string
      redirectUrl: string
      audience: string
    }
  }
}
// It is always important to ensure you import/export something when augmenting a type
export {}
