import { expect, test } from '@playwright/test'

const storyUrl = (id: string) => `/iframe.html?id=${id}&viewMode=story`

async function disableAnimations(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content:
      '*,:before,:after{transition:none!important;animation:none!important}',
  })
}

test.describe('AddDataSourceModal stories VRT', () => {
  test('Default', async ({ page }) => {
    await page.goto(
      storyUrl('components-pages-dashboard-adddatasourcemodal--default')
    )
    await disableAnimations(page)
    // const root = page.locator('#storybook-root')
    await expect(page).toHaveScreenshot('add-data-source-modal-default.png')
  })

  test('WithError', async ({ page }) => {
    await page.goto(
      storyUrl('components-pages-dashboard-adddatasourcemodal--with-error')
    )
    await disableAnimations(page)
    await page
      .getByText('https://github.com/{owner}/{repo} の形式で入力してください。')
      .waitFor()
    // const root = page.locator('#storybook-root')
    await expect(page).toHaveScreenshot('add-data-source-modal-error.png')
  })
})
