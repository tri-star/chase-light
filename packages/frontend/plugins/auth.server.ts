export default defineNuxtPlugin(async (nuxtApp) => {
  // サーバーサイドでのみ実行
  if (!import.meta.server) return;

  try {
    // Nuxtのeventを取得してセッション情報を直接取得
    const event = nuxtApp.ssrContext?.event;
    if (!event) {
      return;
    }

    // セッション情報を直接取得
    const { getUserSession } = await import('~/server/utils/session');
    const session = await getUserSession(event);

    if (session && session.userId) {
      const user = {
        id: session.userId,
        email: session.email,
        name: session.name,
        avatar: session.avatar,
        provider: session.provider,
      };

      useState('auth.user', () => user);
      useState('auth.loggedInAt', () => session.loggedInAt?.toISOString());
    } else {
      useState('auth.user', () => null);
      useState('auth.loggedInAt', () => null);
    }
  } catch (error) {
    console.error('Auth plugin error:', error);
    useState('auth.user', () => null);
    useState('auth.loggedInAt', () => null);
  }
});
