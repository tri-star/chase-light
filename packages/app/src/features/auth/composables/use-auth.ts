export function useAuth() {
  function buildLoginUrl() {
    const config = useRuntimeConfig()
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

    return authorizeUrl.toString()
  }

  async function logout(returnTo?: string) {
    const config = useRuntimeConfig()
    const { clear } = useUserSession()

    const logoutUrl = `https://${config.public.auth0.domain}/v2/logout?client_id=${config.public.auth0.clientId}&returnTo=${returnTo}`
    await clear()
    return navigateTo(logoutUrl, { external: true })
  }

  return {
    buildLoginUrl,
    logout,
  }
}
