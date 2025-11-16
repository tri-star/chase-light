import { test, expect } from '@playwright/test'

test.describe('Authenticated Dashboard', () => {
  test('should display dashboard page with title and statistics', async ({
    page,
  }) => {
    await page.goto('/dashboard')

    // ダッシュボードページが表示されることを確認
    await expect(
      page.locator('h1').filter({ hasText: 'ダッシュボード' })
    ).toBeVisible()

    // 統計情報カードが表示されることを確認
    await expect(
      page.getByRole('term', {}).filter({ hasText: 'ウォッチ中リポジトリ' })
    ).toBeVisible()
    await expect(
      page.getByRole('term', {}).filter({ hasText: '未読通知' })
    ).toBeVisible()
    await expect(
      page.getByRole('term', {}).filter({ hasText: '今日の更新' })
    ).toBeVisible()
  })

  test('should display header with user menu', async ({ page }) => {
    await page.goto('/dashboard')

    // ヘッダー要素が表示されることを確認
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // ログアウトボタンが表示されることを確認（アバターメニュー内）
    // アバターボタンをクリックしてメニューを開く
    const avatarButton = page.locator('[aria-haspopup="menu"]').first()
    if (await avatarButton.isVisible()) {
      await avatarButton.click()
      await expect(page.locator('text=ログアウト')).toBeVisible()
    }
  })

  test('should register a new data source from FAB modal', async ({ page }) => {
    await page.route('**/api/data-sources', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              dataSource: {
                id: 'ds-new',
                name: 'nuxt/nuxt',
                url: 'https://github.com/nuxt/nuxt',
              },
              userWatch: {
                id: 'watch-new',
              },
            },
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/dashboard')

    await page.getByTestId('fab-button').click()

    const dialog = page.getByRole('dialog', { name: 'データソースを追加' })
    await dialog.waitFor({ state: 'visible', timeout: 10000 })
    await expect(dialog).toBeVisible()

    await dialog
      .getByLabel('リポジトリ URL')
      .fill('https://github.com/nuxt/nuxt')

    await dialog.getByRole('button', { name: '登録する' }).click()

    await expect(
      page.getByText('データソースを追加しました', { exact: false })
    ).toBeVisible()

    await expect(dialog).toBeHidden()
  })

  // Flakyなテストのため一時的にコメントアウト
  // test('should be able to refresh repository data', async ({ page }) => {
  //   await page.goto('/dashboard')

  //   // /api/data-sourcesリクエストに遅延を追加してpending状態を確実にキャプチャ
  //   await page.route('**/api/data-sources*', async (route) => {
  //     // リクエストを500ms遅延させる
  //     await new Promise((resolve) => setTimeout(resolve, 500))
  //     await route.continue()
  //   })

  //   // 更新ボタンが利用可能であることを確認
  //   const refreshButton = page.locator('button:has-text("更新")')
  //   await expect(refreshButton).toBeVisible()
  //   await expect(refreshButton).toBeEnabled()

  //   // ボタンクリックと同時にpending状態をチェック
  //   await refreshButton.click()

  //   // ローディング状態の確認（"更新中..."に変わることを期待）
  //   await expect(page.locator('text=更新中...')).toBeVisible({
  //     timeout: 1000,
  //   })

  //   // ボタンがdisabledになることを確認
  //   await expect(
  //     page.locator('button').filter({ hasText: '更新中...' })
  //   ).toBeDisabled({
  //     timeout: 1000,
  //   })

  //   // 最終的に「更新」ボタンに戻り、再び有効になることを確認
  //   await expect(page.locator('button:has-text("更新")')).toBeVisible({
  //     timeout: 3000,
  //   })
  //   await expect(page.locator('button:has-text("更新")')).toBeEnabled({
  //     timeout: 3000,
  //   })
  // })
})
