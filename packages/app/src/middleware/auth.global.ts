import { useAuth } from '~/features/auth/composables/use-auth'

export default defineNuxtRouteMiddleware(async (from, to) => {
  if (to.meta.allowGuest) return

  // Storybookのiframe.htmlは認証不要
  if (from.fullPath.match(/\/iframe.html.*/)) {
    return
  }

  const { loggedIn } = useUserSession()
  const { buildLoginUrl } = useAuth()
  if (!loggedIn.value) {
    const authorizeUrl = buildLoginUrl()
    return await navigateTo(authorizeUrl.toString(), { external: true })
  }
})
