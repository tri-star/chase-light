import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { server } from '~/tests/setup/msw-server'
import { getGetApiActivitiesActivityIdMockHandler } from '~/generated/api/backend.msw'
import type { ActivityDetailResponseData } from '~/generated/api/schemas'

const activityId = 'activity-1'

const buildActivity = (
  override?: Partial<ActivityDetailResponseData['activity']>
): ActivityDetailResponseData['activity'] => ({
  id: 'activity-1',
  activityType: 'release',
  title: 'Release v1.0',
  translatedTitle: 'リリース v1.0',
  summary: 'A new release is available',
  detail: 'Original body in English',
  translatedBody: '翻訳済みの本文です',
  status: 'completed',
  statusDetail: null,
  version: 'v1.0.0',
  occurredAt: '2024-05-01T12:00:00Z',
  lastUpdatedAt: '2024-05-02T12:00:00Z',
  source: {
    id: 'source-1',
    sourceType: 'github',
    name: 'nuxt/nuxt',
    url: 'https://github.com/nuxt/nuxt',
    metadata: {
      repositoryFullName: 'nuxt/nuxt',
      repositoryLanguage: 'TypeScript',
      starsCount: 1000,
      forksCount: 100,
      openIssuesCount: 10,
    },
  },
  ...override,
})

const mountPage = async (
  override?: Partial<ActivityDetailResponseData['activity']>
) => {
  server.use(
    getGetApiActivitiesActivityIdMockHandler({
      success: true,
      data: { activity: buildActivity(override) },
    })
  )

  const Page = (await import('~/pages/activities/[id].vue')).default
  return mountSuspended(Page, {
    route: {
      params: { id: activityId },
      name: 'activities-id',
    },
  })
}

describe('ActivityDetailPage', () => {
  it('詳細情報を表示する', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('nuxt/nuxt')
    expect(wrapper.text()).toContain('リリース v1.0')
    expect(wrapper.get('[data-testid="activity-body"]').text()).toContain(
      '翻訳済みの本文です'
    )

    const actions = wrapper.findAll('[data-testid="cl-icon-button"]')
    expect(actions).toHaveLength(3)
  })

  it('トグルで翻訳と原文を切り替える', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('リリース v1.0')
    expect(wrapper.get('[data-testid="activity-body"]').text()).toContain(
      '翻訳済みの本文です'
    )

    await wrapper.get('[data-testid="translation-toggle"]').trigger('click')

    expect(wrapper.text()).toContain('Release v1.0')
    expect(wrapper.get('[data-testid="activity-body"]').text()).toContain(
      'Original body in English'
    )
  })

  it('翻訳がない場合は原文のみ表示し、トグルは無効化する', async () => {
    const wrapper = await mountPage({
      translatedBody: null,
      translatedTitle: null,
    })

    const toggle = wrapper.get('[data-testid="translation-toggle"]')
    expect(toggle.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Release v1.0')
    expect(wrapper.get('[data-testid="activity-body"]').text()).toContain(
      'Original body in English'
    )
  })
})
