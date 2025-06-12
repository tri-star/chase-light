import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // ホームページに移動
  await page.goto('/');

  // テスト専用ログインエンドポイントをページコンテキストで呼び出し
  const response = await page.request.post('/api/auth/test-login', {
    data: {
      userId: 'playwright-test-user',
      email: 'playwright-test@example.com',
      name: 'Playwright Test User',
      avatar: 'https://github.com/playwright-test.png',
      provider: 'github',
    },
  });

  expect(response.ok()).toBeTruthy();
  const result = await response.json();
  expect(result.success).toBe(true);

  // ページをリロードしてセッション情報を反映
  await page.reload();
  await page.waitForTimeout(2000);

  // ログイン状態であることを確認（ダッシュボードリンクが表示される）
  await expect(page.locator('text=Go to Dashboard')).toBeVisible({
    timeout: 10000,
  });

  // 認証状態を保存
  await page.context().storageState({ path: authFile });

  console.log('✓ Authentication setup completed');
});
