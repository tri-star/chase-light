import { test, expect } from '@playwright/test';

test.describe('Public Home Page', () => {
  test('should display the home page correctly', async ({ page }) => {
    await page.goto('/');

    // ページタイトルを確認
    await expect(page).toHaveTitle(/Chase Light/);

    // メインヘッダーを確認
    await expect(page.locator('h1')).toContainText('Chase Light');
    await expect(page.locator('p.text-xl.text-gray-600')).toContainText(
      'GitHub Repository Activity Tracker'
    );

    // ログインボタンを確認
    await expect(page.locator('text=Login with GitHub')).toBeVisible();
  });

  test('should display feature sections', async ({ page }) => {
    await page.goto('/');

    // 機能説明セクションを確認
    await expect(page.locator('text=Repository Monitoring')).toBeVisible();
    await expect(page.locator('text=Smart Notifications')).toBeVisible();
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible();

    // 各機能の説明文を確認
    await expect(
      page.locator(
        'text=Track activity across your favorite GitHub repositories'
      )
    ).toBeVisible();
    await expect(
      page.locator('text=Get notified about important events')
    ).toBeVisible();
    await expect(
      page.locator('text=Visualize repository trends')
    ).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // コンテンツが表示されることを確認
    await expect(page.locator('h1')).toContainText('Chase Light');
    await expect(page.locator('text=Login with GitHub')).toBeVisible();
  });
});
