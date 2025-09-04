import { expect, test } from '@playwright/test'

const storyUrl = (id: string) => `/iframe.html?id=${id}&viewMode=story`

// Prevent flakiness due to animations/transitions
async function disableAnimations(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content:
      '*,:before,:after{transition:none!important;animation:none!important}',
  })
}

test.describe('DashboardPage stories VRT', () => {
  test('Default story', async ({ page }) => {
    await page.goto(storyUrl('components-pages-dashboardpage--default'))
    await disableAnimations(page)
    await page.waitForLoadState('domcontentloaded')
    // Wait for mock data to render
    await page.getByText('nuxt/nuxt').waitFor()

    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('dashboard-default.png')
  })

  test('Empty story', async ({ page }) => {
    await page.goto(storyUrl('components-pages-dashboardpage--empty'))
    await disableAnimations(page)
    await page.getByText('ウォッチ中のリポジトリがありません').waitFor()
    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('dashboard-empty.png')
  })

  test('Error story', async ({ page }) => {
    await page.goto(storyUrl('components-pages-dashboardpage--error'))
    await disableAnimations(page)
    await page.getByText('データの読み込みに失敗しました').waitFor()
    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('dashboard-error.png')
  })

  test('ManyRepositories story', async ({ page }) => {
    await page.goto(
      storyUrl('components-pages-dashboardpage--many-repositories')
    )
    await disableAnimations(page)
    await page.getByText('25').first().waitFor()
    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('dashboard-many.png')
  })
})
