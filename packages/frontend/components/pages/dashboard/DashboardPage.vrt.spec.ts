import { expect, test } from '@playwright/test'

const storyUrl = (id: string) => `/iframe.html?id=${id}&viewMode=story`

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
    await page.getByText('v3.12.0 リリース').waitFor()

    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('dashboard-default.png')
  })

  test('Empty story', async ({ page }) => {
    await page.goto(storyUrl('components-pages-dashboardpage--empty'))
    await disableAnimations(page)
    await page.getByText('未読通知はありません').waitFor()
    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('dashboard-empty.png')
  })

  test('Error story', async ({ page }) => {
    await page.goto(storyUrl('components-pages-dashboardpage--error'))
    await disableAnimations(page)
    await page.getByText('再読み込み').waitFor()
    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('dashboard-error.png')
  })

  test('WithNextPage story', async ({ page }) => {
    await page.goto(storyUrl('components-pages-dashboardpage--with-next-page'))
    await disableAnimations(page)
    await page.getByText('もっと見る').first().waitFor()
    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('dashboard-next-page.png')
  })
})
