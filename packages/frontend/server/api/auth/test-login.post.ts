export default defineEventHandler(async (event) => {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    });
  }

  const body = await readBody(event);
  const {
    userId = 'test-user-123',
    email = 'test@example.com',
    name = 'Test User',
    avatar = 'https://github.com/test.png',
    provider = 'github',
  } = body || {};

  try {
    // テスト用のセッションを作成
    const session = await setUserSession(event, {
      userId,
      email,
      name,
      avatar,
      provider,
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      loggedInAt: new Date(),
    });

    return {
      success: true,
      message: 'Test session created successfully',
      sessionId: session.id,
      user: {
        id: userId,
        email,
        name,
        avatar,
        provider,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create test session: ${error}`,
    });
  }
});
