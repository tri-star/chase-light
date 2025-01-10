import { useAuth } from '~/features/auth/composables/use-auth'

export default defineNuxtPlugin(() => {
  const a3Fetch = $fetch.create({
    async onResponseError({ response }) {
      console.log('Client Error', response)
      if (response.status === 401) {
        const { buildLoginUrl } = useAuth()
        const loginUrl = buildLoginUrl()
        console.log(`redirect to ${loginUrl}`)
        navigateTo(loginUrl)
      }
    },
  })

  return {
    provide: {
      a3Fetch,
    },
  }
})
