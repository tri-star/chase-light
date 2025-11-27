import { test, expect } from '@playwright/test'

const activityId = 'activity-e2e-1'

const mockActivityResponse = {
  success: true,
  data: {
    activity: {
      id: activityId,
      activityType: 'release',
      title: 'Release 2.0',
      translatedTitle: 'リリース 2.0',
      summary: 'A major release',
      detail: 'Original release notes',
      translatedBody: '翻訳済みのリリースノート',
      status: 'completed',
      statusDetail: null,
      version: '2.0.0',
      occurredAt: '2024-05-01T10:00:00Z',
      lastUpdatedAt: '2024-05-02T10:00:00Z',
      source: {
        id: 'source-1',
        sourceType: 'github',
        name: 'nuxt/nuxt',
        url: 'https://github.com/nuxt/nuxt',
        metadata: {
          repositoryFullName: 'nuxt/nuxt',
          repositoryLanguage: 'TypeScript',
          starsCount: 1200,
          forksCount: 80,
          openIssuesCount: 3,
        },
      },
    },
  },
}

test.describe('Activity Detail Page', () => {
  test('should display translated content and actions', async ({ page }) => {
    await page.route('**/api/activities/*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockActivityResponse),
        })
        return
      }
      await route.continue()
    })

    await page.goto(`/activities/${activityId}`)

    await expect(
      page.getByRole('heading', { name: 'リリース 2.0' })
    ).toBeVisible()
    await expect(
      page.getByTestId('activity-body').getByText('翻訳済みのリリースノート')
    ).toBeVisible()
    await expect(
      page.getByTestId('activity-actions').locator('button')
    ).toHaveCount(3)

    await page.getByTestId('translation-toggle').click()
    await expect(
      page.getByRole('heading', { name: 'Release 2.0' })
    ).toBeVisible()
    await expect(
      page.getByTestId('activity-body').getByText('Original release notes')
    ).toBeVisible()
  })
})
