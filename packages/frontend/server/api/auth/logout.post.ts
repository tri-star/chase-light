import { clearUserSession } from '~/server/utils/session'
import { generateAuth0LogoutUrl } from '~/server/utils/auth0'

export default defineEventHandler(async (event) => {
  try {
    // セッションをクリア
    await clearUserSession(event)

    // Auth0からもログアウト
    const logoutUrl = await generateAuth0LogoutUrl()

    return {
      success: true,
      logoutUrl,
    }
  } catch (err) {
    console.error('Logout error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Logout failed',
    })
  }
})
