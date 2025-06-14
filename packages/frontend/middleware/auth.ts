export default defineNuxtRouteMiddleware(async (_to, _from) => {
  // サーバーサイドでのみ実行
  if (import.meta.server) {
    try {
      // サーバーサイドではセッションAPIを呼び出し、ヘッダーを適切に設定
      const event = await useRequestEvent();
      const headers = event?.node?.req?.headers || {};

      // セッション情報を取得（内部APIコール、クッキーヘッダーを含める）
      const response = await $fetch('/api/auth/session', {
        headers: {
          cookie: headers.cookie || '',
        },
      });

      // セッションが存在しない場合はログインページにリダイレクト
      if (!response?.data) {
        return navigateTo('/auth/login', { external: true });
      }
    } catch (_error) {
      // 認証エラーの場合、ログインページにリダイレクト
      return navigateTo('/auth/login', { external: true });
    }
  }

  // クライアントサイドでの認証チェック
  if (import.meta.client) {
    const { data: session } = await useFetch('/api/auth/session');

    if (!session.value) {
      return navigateTo('/auth/login', { external: true });
    }
  }
});
