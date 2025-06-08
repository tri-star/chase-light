import { createAuth0 } from '@auth0/auth0-vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  const auth0 = createAuth0({
    domain: config.public.auth0Domain,
    clientId: config.public.auth0ClientId,
    authorizationParams: {
      redirect_uri: `${window.location.origin}/callback`,
      audience: `https://${config.public.auth0Domain}/api/v2/`,
      scope: 'openid profile email read:current_user update:current_user_metadata'
    },
    useRefreshTokens: true,
    cacheLocation: 'localstorage'
  })

  nuxtApp.vueApp.use(auth0)
  
  return {
    provide: {
      auth0
    }
  }
})