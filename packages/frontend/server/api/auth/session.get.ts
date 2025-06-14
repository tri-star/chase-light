import { getUserSession } from '~/server/utils/session';

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);

    if (!session) {
      return {
        data: null,
      };
    }

    // セキュリティ上、トークンは除外してクライアントに返す
    const { _accessToken, _refreshToken, ...safeSession } = session;

    return {
      data: {
        user: {
          id: safeSession.userId,
          email: safeSession.email,
          name: safeSession.name,
          avatar: safeSession.avatar,
          provider: safeSession.provider,
        },
        loggedInAt:
          safeSession.loggedInAt?.toISOString() || new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('Session fetch error:', err);
    return {
      data: null,
    };
  }
});
