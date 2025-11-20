import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // テスト用認証APIを実行しセッションを作成
  await page.goto('/api/auth/test-login')

  await page.goto('/dashboard')
  await page.waitForURL('/dashboard', { timeout: 10000 })

  // ログイン状態であることを確認（ダッシュボードページが表示される）
  await expect(
    page.locator('h1').filter({ hasText: 'ダッシュボード' })
  ).toBeVisible({
    timeout: 10000,
  })

  // 認証状態を保存
  await page.context().storageState({ path: authFile })

  console.log('✓ Authentication setup completed')
})
