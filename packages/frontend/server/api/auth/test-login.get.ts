import { issueTestJwt, isTestAuthEnabled, resolveTestUser } from 'shared'

export default defineEventHandler(async (event) => {
  // 本番環境では無効化
  if (process.env.APP_STAGE === 'prod' || !isTestAuthEnabled()) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    })
  }

  const query = getQuery(event)
  const requestedId = typeof query.id === 'string' ? query.id : undefined

  let user
  try {
    user = resolveTestUser(requestedId)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage:
        error instanceof Error
          ? error.message
          : 'Invalid test user id specified',
    })
  }

  let token: string
  try {
    ;({ token } = await issueTestJwt({ userId: user.id }))
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error
          ? `Failed to issue test token: ${error.message}`
          : 'Failed to issue test token',
    })
  }

  try {
    // テスト用のセッションを作成
    const session = await setUserSession(event, {
      userId: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatarUrl,
      provider: 'test-auth',
      accessToken: token,
      refreshToken: 'test-refresh-token',
      loggedInAt: new Date(),
    })

    return {
      success: true,
      message: 'Test session created successfully',
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatarUrl,
        provider: 'test-auth',
      },
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error
          ? `Failed to create test session: ${error.message}`
          : 'Failed to create test session: Unknown error',
    })
  }
})
