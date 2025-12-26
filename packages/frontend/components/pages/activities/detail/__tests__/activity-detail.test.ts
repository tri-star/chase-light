import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { ActivityDetail } from '~/features/activities/domain/activity'
const activityId = 'activity-1'
const fetchMock = vi.fn()
const translationRequestMock = vi.fn()
const translationGetStatusMock = vi.fn()

vi.mock('~/features/activities/repositories/activity-detail-repository', () => {
  return {
    ActivityDetailRepository: vi.fn().mockImplementation(() => ({
      fetch: fetchMock,
    })),
  }
})

vi.mock(
  '~/features/activities/repositories/activity-translation-repository',
  () => {
    return {
      ActivityTranslationRepository: vi.fn().mockImplementation(() => ({
        request: translationRequestMock,
        getStatus: translationGetStatusMock,
      })),
    }
  }
)

const buildActivity = (override?: Partial<ActivityDetail>): ActivityDetail => ({
  id: 'activity-1',
  activityType: 'release',
  title: 'Release v1.0',
  translatedTitle: 'リリース v1.0',
  summary: 'A new release is available',
  detail: 'Original body in English',
  translatedBody: '翻訳済みの本文です',
  bodyTranslationStatus: 'completed',
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

const mountPage = async (override?: Partial<ActivityDetail>) => {
  fetchMock.mockResolvedValue(buildActivity(override))

  const Page = (
    await import('~/components/pages/activities/detail/ActivityDetailPage.vue')
  ).default
  return mountSuspended(Page, {
    props: {
      activityId,
    },
  })
}

afterEach(() => {
  vi.clearAllMocks()
  fetchMock.mockReset()
  translationRequestMock.mockReset()
  translationGetStatusMock.mockReset()
})

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

  describe('翻訳リクエスト機能', () => {
    it('翻訳がない場合、翻訳リクエストバナーが表示される', async () => {
      const wrapper = await mountPage({
        translatedBody: null,
        translatedTitle: null,
        bodyTranslationStatus: 'idle',
      })

      const banner = wrapper.find('[data-testid="translation-request-banner"]')
      expect(banner.exists()).toBe(true)
      expect(banner.text()).toContain('日本語訳がまだありません')

      const requestButton = wrapper.find(
        '[data-testid="request-translation-button"]'
      )
      expect(requestButton.exists()).toBe(true)
    })

    it('翻訳がある場合、翻訳リクエストバナーは表示されない', async () => {
      const wrapper = await mountPage()

      const banner = wrapper.find('[data-testid="translation-request-banner"]')
      expect(banner.exists()).toBe(false)
    })

    it('翻訳中は本文エリアがpulseする', async () => {
      const wrapper = await mountPage({
        translatedBody: null,
        translatedTitle: null,
        bodyTranslationStatus: 'processing',
      })

      const bodyContainer = wrapper.get(
        '[data-testid="activity-body-container"]'
      )
      expect(bodyContainer.classes()).toContain('animate-pulse')
    })

    it('翻訳リクエストボタンをクリックすると翻訳リクエストが送信される', async () => {
      translationRequestMock.mockResolvedValue({
        translationStatus: 'queued',
        statusDetail: null,
      })

      const wrapper = await mountPage({
        translatedBody: null,
        translatedTitle: null,
        bodyTranslationStatus: 'idle',
      })

      const requestButton = wrapper.get(
        '[data-testid="request-translation-button"]'
      )
      await requestButton.trigger('click')

      expect(translationRequestMock).toHaveBeenCalledOnce()
      expect(translationRequestMock).toHaveBeenCalledWith('activity-1')
    })
  })
})
