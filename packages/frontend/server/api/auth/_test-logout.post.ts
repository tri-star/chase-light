export default defineEventHandler(async (event) => {
  // 本番環境では無効化
  if (process.env.APP_STAGE === 'production') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    });
  }

  try {
    // セッションをクリア
    const cleared = await clearUserSession(event);

    return {
      success: true,
      message: 'Test session cleared successfully',
      cleared,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to clear test session: ${error}`,
    });
  }
});
