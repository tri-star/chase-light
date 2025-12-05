import { expect, test } from '@playwright/test'

const storyUrl = (id: string) => `/iframe.html?id=${id}&viewMode=story`

// Prevent flakiness due to animations/transitions
async function disableAnimations(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content:
      '*,:before,:after{transition:none!important;animation:none!important}',
  })
}

// VRTスクリーンショット用のヘルパー関数
// 相対日時など実行時刻により変動する要素を自動的にマスクする
async function expectScreenshot(
  page: import('@playwright/test').Page,
  name: string
) {
  const root = page.locator('#storybook-root')
  // 相対日時は実行時刻により変動するためマスク
  const dynamicElements = [page.locator('[data-id="activity-occurred-at"]')]
  await expect(root).toHaveScreenshot(name, {
    mask: dynamicElements,
  })
}

test.describe('DashboardPage stories VRT', () => {
  test('Default story', async ({ page }) => {
    await page.goto(storyUrl('components-pages-dashboardpage--default'))
    await disableAnimations(page)
    await page.waitForLoadState('domcontentloaded')
    // Wait for mock data to render
    // await page.getByText('facebook/react').waitFor()

    await expectScreenshot(page, 'dashboard-default.png')
  })

  test('Default story with modal open', async ({ page }) => {
    await page.goto(storyUrl('components-pages-dashboardpage--default'))
    await disableAnimations(page)
    await page.waitForLoadState('domcontentloaded')
    await page.getByTestId('fab-button').click()
    await page.getByText('リポジトリ URL').waitFor()
    await expectScreenshot(page, 'dashboard-default-modal.png')
  })

  test('Empty story', async ({ page }) => {
    await page.goto(storyUrl('components-pages-dashboardpage--empty'))
    await disableAnimations(page)
    await page.getByText('新しい通知はありません').waitFor()
    await expectScreenshot(page, 'dashboard-empty.png')
  })

  test('Error story', async ({ page }) => {
    await page.goto(storyUrl('components-pages-dashboardpage--error'))
    await disableAnimations(page)
    await page.getByText('通知の読み込みに失敗しました').waitFor()
    await expectScreenshot(page, 'dashboard-error.png')
  })

  test('ManyNotifications story', async ({ page }) => {
    await page.goto(
      storyUrl('components-pages-dashboardpage--many-notifications')
    )
    await disableAnimations(page)
    await page.getByText('25').first().waitFor()
    await expectScreenshot(page, 'dashboard-many.png')
  })
})
