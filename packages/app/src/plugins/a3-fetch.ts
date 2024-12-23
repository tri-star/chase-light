import { useAuth } from "~/features/auth/composables/use-auth"

export default defineNuxtPlugin((nuxtApp) => {
  const a3Fetch = $fetch.create({
    async onResponseError({ response }) {
      if (response.status === 401) {
        await nuxtApp.runWithContext(() => {
          const { buildLoginUrl } = useAuth()
          const loginUrl = buildLoginUrl()
          navigateTo(loginUrl)
        })
      }
    },
  })
  return {
    provide: {
      a3Fetch,
    },
  }
})
