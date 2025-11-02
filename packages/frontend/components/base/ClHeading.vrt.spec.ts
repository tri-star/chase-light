import { expect, test } from '@playwright/test'

const storyUrl = (id: string) => `/iframe.html?id=${id}&viewMode=story`

/**
 * アニメーションを無効化してVRTのちらつきを防ぐ
 */
async function disableAnimations(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content:
      '*,:before,:after{transition:none!important;animation:none!important}',
  })
}

test.describe('ClHeading stories VRT', () => {
  test('Level1 story - 最大フォントサイズが適用される', async ({ page }) => {
    await page.goto(storyUrl('components-base-clheading--level-1'))
    await disableAnimations(page)
    await page.waitForLoadState('domcontentloaded')

    // コンテンツが表示されるまで待機（h1タグではなくテキストで待つ）
    await page.getByText('レベル1の見出し（最大）').waitFor()

    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('clheading-level1.png')
  })

  test('Level2 story - 中フォントサイズが適用される', async ({ page }) => {
    await page.goto(storyUrl('components-base-clheading--level-2'))
    await disableAnimations(page)
    await page.waitForLoadState('domcontentloaded')

    // コンテンツが表示されるまで待機
    await page.getByText('レベル2の見出し（中）').waitFor()

    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('clheading-level2.png')
  })

  test('Level3 story - 小フォントサイズが適用される', async ({ page }) => {
    await page.goto(storyUrl('components-base-clheading--level-3'))
    await disableAnimations(page)
    await page.waitForLoadState('domcontentloaded')

    // コンテンツが表示されるまで待機
    await page.getByText('レベル3の見出し（小）').waitFor()

    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('clheading-level3.png')
  })

  test('AllLevelsComparison story - 全レベルのフォントサイズを視覚的に比較', async ({
    page,
  }) => {
    await page.goto(
      storyUrl('components-base-clheading--all-levels-comparison')
    )
    await disableAnimations(page)
    await page.waitForLoadState('domcontentloaded')

    // すべてのレベルの見出しが表示されるまで待機
    await page.getByText('レベル1の見出し').waitFor()
    await page.getByText('レベル2の見出し').waitFor()
    await page.getByText('レベル3の見出し').waitFor()

    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('clheading-all-levels.png')
  })

  test('WithLongText story - 長いテキストでの表示', async ({ page }) => {
    await page.goto(storyUrl('components-base-clheading--with-long-text'))
    await disableAnimations(page)
    await page.waitForLoadState('domcontentloaded')

    // コンテンツが表示されるまで待機
    await page
      .getByText('これは非常に長い見出しテキストで、複数行にわたる場合')
      .waitFor()

    const root = page.locator('#storybook-root')
    await expect(root).toHaveScreenshot('clheading-long-text.png')
  })
})
