import { test, expect } from '@playwright/test'

test.describe('Authenticated Profile Page', () => {
  test('should display profile page with user information', async ({ page }) => {
    await page.goto('/profile')

    // プロファイルページが表示されることを確認
    await expect(page.locator('text=Profile Information')).toBeVisible()

    // ナビゲーションを確認
    await expect(page.locator('text=Chase Light')).toBeVisible()
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Profile information')).toBeVisible()
  })

  test('should display user profile details', async ({ page }) => {
    await page.goto('/profile')

    // プロファイル情報の表示を確認
    await expect(page.locator('text=Playwright Test User')).toBeVisible()
    await expect(page.locator('text=playwright-test@example.com')).toBeVisible()
    await expect(page.locator('text=playwright-test-user')).toBeVisible()
    await expect(page.locator('[data-testid="auth-provider"]')).toContainText('github')
  })

  test('should navigate to dashboard from profile', async ({ page }) => {
    await page.goto('/profile')

    // ダッシュボードリンクをクリック
    await page.click('text=Dashboard')

    // ダッシュボードページに移動することを確認
    await page.waitForURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  // test('should redirect to login when accessing profile without auth', async ({ browser }) => {
  //   // 新しい認証なしコンテキストを作成
  //   const context = await browser.newContext()
  //   const page = await context.newPage()

  //   // プロファイルページに直接アクセスを試行
  //   await page.goto('/profile')

  //   // ログインページにリダイレクトされることを確認
  //   await page.waitForURL(/\/api\/auth\/login/)

  //   await context.close()
  // })
})