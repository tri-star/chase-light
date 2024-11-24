export default defineNuxtRouteMiddleware((from, to) => {
  if (to.meta.allowGuest) return

  const { loggedIn } = useUserSession()
  const config = useRuntimeConfig()
  if (!loggedIn.value) {
    const authorizeUrl = new URL(
      `https://${config.public.auth0.domain}/authorize`,
    )
    authorizeUrl.searchParams.append("response_type", "code")
    authorizeUrl.searchParams.append("client_id", config.public.auth0.clientId)
    authorizeUrl.searchParams.append(
      "redirect_uri",
      config.public.auth0.redirectUrl,
    )
    authorizeUrl.searchParams.append(
      "scope",
      "openid profile email offline_access",
    )
    authorizeUrl.searchParams.append("audience", config.public.auth0.audience)
    return navigateTo(authorizeUrl.toString(), { external: true })
  }
})
