import { requireUserSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  // セッション認証を要求
  const session = await requireUserSession(event)

  // Simulate API processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 認証されたユーザーの情報とテストデータを返す
  return {
    message: 'Protected API endpoint accessed successfully',
    timestamp: new Date().toISOString(),
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      provider: session.provider
    },
    sessionInfo: {
      sessionId: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      loggedInAt: session.loggedInAt
    }
  }
})