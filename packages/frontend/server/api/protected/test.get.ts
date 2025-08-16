import { getUserSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  // セッション情報を取得（ミドルウェアで認証済み）
  const session = await getUserSession(event)

  // Simulate API processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 認証されたユーザーの情報とテストデータを返す
  return {
    message: 'Protected API endpoint accessed successfully',
    timestamp: new Date().toISOString(),
    user: {
      id: session!.userId,
      email: session!.email,
      name: session!.name,
      provider: session!.provider,
    },
    sessionInfo: {
      sessionId: session!.id,
      createdAt: session!.createdAt,
      expiresAt: session!.expiresAt,
      loggedInAt: session!.loggedInAt,
    },
  }
})
