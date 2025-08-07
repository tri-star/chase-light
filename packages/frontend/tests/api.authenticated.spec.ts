import { test, expect } from '@playwright/test'

test.describe('Protected API Endpoints', () => {
  test('should access protected test endpoint with authentication', async ({
    request,
  }) => {
    // 保護されたAPIエンドポイントにアクセス
    const response = await request.get('/api/protected/test')

    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.message).toBe('Protected API endpoint accessed successfully')
    expect(data.user.id).toBe('test-user-123')
    expect(data.user.email).toBe('test@example.com')
    expect(data.sessionInfo).toBeDefined()
  })

  test('should access session endpoint', async ({ request }) => {
    const response = await request.get('/api/auth/session')

    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.data.user.id).toBe('test-user-123')
    expect(data.data.user.email).toBe('test@example.com')
    expect(data.data.user.name).toBe('Test User')
  })

  test('should access GitHub user API (expect error with test token)', async ({
    request,
  }) => {
    // テスト環境では実際のGitHubトークンがないため、エラーレスポンスを期待
    const response = await request.get('/api/github/user')

    // 401 (トークンエラー) または 500 (API呼び出しエラー) を期待
    expect([401, 500]).toContain(response.status())
  })

  test('should access GitHub repos API (expect error with test token)', async ({
    request,
  }) => {
    // テスト環境では実際のGitHubトークンがないため、エラーレスポンスを期待
    const response = await request.get('/api/github/repos')

    // 401 (トークンエラー) または 500 (API呼び出しエラー) を期待
    expect([401, 500]).toContain(response.status())
  })

  // test('should reject access to protected API without authentication', async ({ browser }) => {
  // // 認証状態を完全にクリアした新しいコンテキストを作成
  // const context = await browser.newContext({
  //   storageState: { cookies: [], origins: [] }
  // })
  // const page = await context.newPage()

  // // 保護されたAPIエンドポイントに直接アクセスを試行
  // const response = await page.request.get('/api/protected/test')

  // // 401 Unauthorizedが返されることを確認
  // expect(response.status()).toBe(401)

  // await context.close()
  // })

  // test('should handle test login page', async ({ page }) => {
  //   // テストログインページの動作確認
  //   await page.goto('/auth/test-login')
  //
  //   // ダッシュボードにリダイレクトされることを確認
  //   await page.waitForURL('/dashboard')
  //   await expect(page.locator('h1')).toContainText('Dashboard')
  // })
  //   expect(data.user.email).toBe('api-test@example.com')
  // })

  // test('should handle test logout endpoint', async ({ request }) => {
  //   // テストログアウトエンドポイントの動作確認
  //   // const response = await request.post('/api/auth/test-logout')

  //   // expect(response.ok()).toBeTruthy()

  //   // const data = await response.json()
  //   // expect(data.success).toBe(true)
  // })
})
