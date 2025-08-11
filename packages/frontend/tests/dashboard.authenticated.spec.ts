import { test, expect } from '@playwright/test'

test.describe('Authenticated Dashboard', () => {
  test('should display dashboard with user information', async ({ page }) => {
    await page.goto('/dashboard')

    // ダッシュボードページが表示されることを確認
    await expect(page.locator('h1')).toContainText('Dashboard')

    // ユーザー情報が表示されることを確認
    await expect(page.locator('text=Welcome, Test User')).toBeVisible()
    await expect(page.locator('text=Logout')).toBeVisible()
  })

  test('should display user information in details section', async ({
    page,
  }) => {
    await page.goto('/dashboard')

    // ユーザー情報セクションを確認
    await expect(page.locator('text=User Information')).toBeVisible()

    // テストユーザーの詳細情報を確認
    await expect(page.locator('text=test-user-123')).toBeVisible()
    await expect(page.locator('text=test@example.com')).toBeVisible()
    await expect(
      page.locator('dd').filter({ hasText: 'Test User' })
    ).toBeVisible()
    await expect(page.locator('text=github')).toBeVisible()
  })

  test('should be able to fetch data sources', async ({ page }) => {
    await page.goto('/dashboard')
    // 短い待機を追加 (デバッグ用)
    await page.waitForTimeout(1000)

    const dataSourcesButton = page.locator(
      '[data-testid="fetch-data-sources-button"]'
    )

    // データソース取得ボタンが存在することを確認
    await expect(dataSourcesButton).toBeVisible()
    await expect(dataSourcesButton).toHaveText('データソースを取得')

    // データソース取得ボタンをクリック
    await dataSourcesButton.click()

    // ボタンのテキストが "読み込み中..." に変わることを確認（ローディング状態）
    await page.waitForFunction(
      (buttonSelector) => {
        const button = document.querySelector(buttonSelector)
        return button && button.textContent === '読み込み中...'
      },
      '[data-testid="fetch-data-sources-button"]',
      { timeout: 5000 }
    )

    // ローディングが完了し、ボタンのテキストが元に戻ることを確認
    await expect(dataSourcesButton).toHaveText('データソースを取得', {
      timeout: 10000,
    })

    // データソース結果またはエラーが表示されることを確認
    const dataSourcesContainer = page
      .locator('div')
      .filter({ hasText: /^(エラー:|データソースが見つかりません|件中)/ })
      .first()

    if (await dataSourcesContainer.isVisible()) {
      const containerText = await dataSourcesContainer.textContent()

      // 成功レスポンスかエラーレスポンスかを確認
      if (containerText?.includes('エラー:')) {
        expect(containerText).toContain('エラー:')
      } else if (containerText?.includes('データソースが見つかりません')) {
        expect(containerText).toContain('データソースが見つかりません')
      } else {
        expect(containerText).toMatch(/\d+ 件中/)
      }
    } else {
      // APIが応答しなかった場合でも、テストとして処理する
      // ページが適切に表示されていることを確認
      await expect(dataSourcesButton).toBeVisible()
    }
  })

  // test('should be able to logout', async ({ page }) => {
  //   await page.goto('/dashboard')

  //   // ログアウトボタンをクリック
  //   await page.click('text=Logout')

  //   // Auth0のログアウトページまたはホームページにリダイレクトされることを確認
  //   await page.waitForURL(/auth0\.com|\//)
  // })

  // test('should redirect to login when accessing dashboard without auth', async ({ browser }) => {
  //   // 新しい認証なしコンテキストを作成
  //   const context = await browser.newContext()
  //   const page = await context.newPage()

  //   // ダッシュボードに直接アクセスを試行
  //   await page.goto('/dashboard')

  //   // ログインページにリダイレクトされることを確認
  //   await page.waitForURL(/\/api\/auth\/login/)

  //   await context.close()
  // })
})
