<template>
  <div>Processing login...</div>
</template>

<script setup>
import crypto from 'crypto';
import { generateAuth0AuthUrl } from '~/server/utils/auth0';

// SSRでの処理

// SSRのタイミングでのみ実行
if (import.meta.server) {
  console.log('ssr');
  // State パラメータを生成（CSRF対策）
  const state = crypto.randomBytes(16).toString('hex');

  // State をセッションに保存（一時的にクッキーに保存）
  const cookie = useCookie('auth-state', {
    httpOnly: true,
    secure: process.env.APP_STAGE === 'prod',
    maxAge: 600, // 10分
    sameSite: 'lax',
  });
  cookie.value = state;

  // Auth0認証URLにリダイレクト
  const authUrl = generateAuth0AuthUrl(state);

  await navigateTo(authUrl, { external: true });
}
</script>
