import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // テスト専用ログインページに移動してセッションを作成
  await page.goto('/auth/test-login')

  // リダイレクトでダッシュボードに移動するのを待つ
  await page.waitForURL('/dashboard', { timeout: 10000 })

  // ログイン状態であることを確認（ダッシュボードページが表示される）
  await expect(page.locator('h1')).toContainText('Dashboard', {
    timeout: 10000,
  })

  // 認証状態を保存
  await page.context().storageState({ path: authFile })

  console.log('✓ Authentication setup completed')
})
