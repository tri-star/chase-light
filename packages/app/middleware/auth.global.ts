export default defineNuxtRouteMiddleware((from, to) => {
  if (!import.meta.server) {
    return
  }

  if (to.meta.allowGuest) return

  const { loggedIn } = useUserSession()
  const config = useRuntimeConfig()
  if (!loggedIn.value) {
    const authorizeUrl = `https://${config.public.auth0.domain}/authorize?response_type=code&client_id=${config.public.auth0.clientId}&redirect_uri=${config.public.auth0.redirectUrl}&scope=openid profile email`
    return navigateTo(authorizeUrl, { external: true })
  }
})
