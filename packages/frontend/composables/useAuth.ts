export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: string;
}

export interface UserSession {
  user: User;
  loggedInAt: string;
}

export const useAuth = () => {
  const user = useState<User | null>('auth.user', () => null);
  const loggedInAt = useState<string | null>('auth.loggedInAt', () => null);

  // セッション情報を取得
  const fetchSession = async () => {
    try {
      const { data } = await $fetch<{ data: UserSession | null }>(
        '/api/auth/session'
      );

      if (data) {
        user.value = data.user;
        loggedInAt.value = data.loggedInAt;
      } else {
        user.value = null;
        loggedInAt.value = null;
      }

      return data;
    } catch (_error) {
      user.value = null;
      loggedInAt.value = null;
      return null;
    }
  };

  // ログイン
  const login = async () => {
    await navigateTo('/api/auth/login');
  };

  // ログアウト
  const logout = async () => {
    try {
      const { logoutUrl } = await $fetch<{ logoutUrl: string }>(
        '/api/auth/logout',
        {
          method: 'POST',
        }
      );

      // セッション状態をクリア
      user.value = null;
      loggedInAt.value = null;

      // Auth0のログアウトページにリダイレクト
      await navigateTo(logoutUrl, { external: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // 認証状態の確認
  const isLoggedIn = computed(() => !!user.value);

  // 初期化時にセッションを取得（クライアントサイドのみ）
  if (import.meta.client && !user.value) {
    fetchSession();
  }

  return {
    user: readonly(user),
    loggedInAt: readonly(loggedInAt),
    isLoggedIn,
    login,
    logout,
    fetchSession,
  };
};
