export default defineNuxtRouteMiddleware((from, to) => {
  if (!import.meta.server) {
    return
  }

  if (to.meta.allowGuest) return

  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo("/auth/auth0", { external: true })
  }
})
