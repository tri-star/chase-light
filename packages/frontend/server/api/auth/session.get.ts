import { getUserSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    
    if (!session) {
      return {
        user: null,
        loggedIn: false
      }
    }
    
    // セキュリティ上、トークンは除外してクライアントに返す
    const { accessToken, refreshToken, ...safeSession } = session
    
    return {
      user: {
        id: safeSession.userId,
        email: safeSession.email,
        name: safeSession.name,
        avatar: safeSession.avatar,
        provider: safeSession.provider
      },
      session: {
        id: safeSession.id,
        loggedInAt: safeSession.loggedInAt,
        expiresAt: safeSession.expiresAt
      },
      loggedIn: true
    }
  } catch (err) {
    console.error('Session fetch error:', err)
    return {
      user: null,
      loggedIn: false
    }
  }
})