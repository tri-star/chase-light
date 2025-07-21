<script setup>
// テスト環境でのみアクセス可能にする
if (process.env.APP_STAGE === 'prod') {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
  });
}

// サーバーサイドでのみ実行
if (import.meta.server) {
  const event = useRequestEvent();

  // テスト用のユーザー情報でセッションを作成
  await setUserSession(event, {
    userId: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://github.com/test.png',
    provider: 'github',
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    loggedInAt: new Date(),
  });

  // ダッシュボードにリダイレクト
  await sendRedirect(event, '/dashboard');
}
</script>

<template>
  <!-- サーバーサイドで処理されるため、このテンプレートは表示されない -->
  <div>
    <p>リダイレクト中...</p>
  </div>
</template>

<style scoped>
form {
  max-width: 400px;
  margin: 20px 0;
}

form div {
  margin-bottom: 10px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input,
select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 20px;
  padding: 10px;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
}

.error {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
}

pre {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
