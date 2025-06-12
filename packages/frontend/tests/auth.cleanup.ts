import { test as cleanup } from '@playwright/test'

cleanup('clear test sessions', async ({ request }) => {
  // テスト用セッションをクリア
  try {
    await request.post('/api/auth/test-logout')
  } catch (error) {
    // クリーンアップの失敗は無視（セッションが存在しない場合もある）
  }
})