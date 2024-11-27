export function useAuth() {
  async function logout(returnTo?: string) {
    const config = useRuntimeConfig()
    const { clear } = useUserSession()

    const logoutUrl = `https://${config.public.auth0.domain}/v2/logout?client_id=${config.public.auth0.clientId}&returnTo=${returnTo}`
    await clear()
    return navigateTo(logoutUrl, { external: true })
  }

  return {
    logout,
  }
}
