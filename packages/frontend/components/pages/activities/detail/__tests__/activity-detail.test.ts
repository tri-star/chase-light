import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import type { ActivityDetail } from '~/features/activities/domain/activity'
import { createActivity } from '~/features/activities/domain/factories/activity-factory'
import type { ActivityDetailRepository } from '~/features/activities/repositories/activity-detail-repository'
import type { ActivityTranslationRepository } from '~/features/activities/repositories/activity-translation-repository'

const activityId = 'activity-1'
const fetchMock = vi.fn<ActivityDetailRepository['fetch']>()
const translationRequestMock = vi.fn<ActivityTranslationRepository['request']>()
const translationGetStatusMock =
  vi.fn<ActivityTranslationRepository['getStatus']>()

let currentWrapper: VueWrapper | null = null

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

const mountPage = async (override?: Partial<ActivityDetail>) => {
  const activity = createActivity(override)
  fetchMock.mockResolvedValue(activity)

  // 毎回新しくインポートして、コンポーネントの状態を完全にリセット
  const { default: Page } = await import(
    '~/components/pages/activities/detail/ActivityDetailPage.vue?t=' +
      Date.now()
  )
  const wrapper = await mountSuspended(Page, {
    props: {
      activityId,
    },
  })

  currentWrapper = wrapper
  return { wrapper, activity }
}

beforeEach(() => {
  // モックの呼び出し履歴だけをクリア（実装は保持）
  fetchMock.mockClear()
  translationRequestMock.mockClear()
  translationGetStatusMock.mockClear()
  // タイマーもクリア
  vi.clearAllTimers()
})

afterEach(() => {
  // 前のwrapperがあれば確実にunmount
  if (currentWrapper) {
    currentWrapper.unmount()
    currentWrapper = null
  }
  vi.clearAllTimers()
})

describe('ActivityDetailPage', () => {
  it('詳細情報を表示する', async () => {
    const { wrapper, activity } = await mountPage()

    expect(wrapper.text()).toContain(activity.source.name)
    if (activity.translatedTitle) {
      expect(wrapper.text()).toContain(activity.translatedTitle)
    }
    expect(wrapper.get('[data-testid="activity-body"]').text()).toContain(
      activity.translatedBody ?? activity.detail
    )

    const actions = wrapper.findAll('[data-testid="cl-icon-button"]')
    expect(actions).toHaveLength(3)
  })

  it('トグルで翻訳と原文を切り替える', async () => {
    const { wrapper, activity } = await mountPage()

    if (activity.translatedTitle) {
      expect(wrapper.text()).toContain(activity.translatedTitle)
    }
    if (activity.translatedBody) {
      expect(wrapper.get('[data-testid="activity-body"]').text()).toContain(
        activity.translatedBody
      )
    }

    await wrapper.get('[data-testid="translation-toggle"]').trigger('click')

    expect(wrapper.text()).toContain(activity.title)
    expect(wrapper.get('[data-testid="activity-body"]').text()).toContain(
      activity.detail
    )
  })

  it('翻訳がない場合は原文のみ表示し、トグルは無効化する', async () => {
    const { wrapper, activity } = await mountPage({
      translatedBody: null,
      translatedTitle: null,
    })

    const toggle = wrapper.get('[data-testid="translation-toggle"]')
    expect(toggle.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain(activity.title)
    expect(wrapper.get('[data-testid="activity-body"]').text()).toContain(
      activity.detail
    )
  })

  describe('翻訳リクエスト機能', () => {
    it('翻訳がない場合、翻訳リクエストバナーが表示される', async () => {
      const { wrapper } = await mountPage({
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
      const { wrapper } = await mountPage()

      const banner = wrapper.find('[data-testid="translation-request-banner"]')
      expect(banner.exists()).toBe(false)
    })

    it('翻訳中は本文エリアがpulseする', async () => {
      translationGetStatusMock.mockResolvedValue({
        translationStatus: 'processing',
        statusDetail: null,
        jobId: 'job-1',
        requestedAt: '2024-05-02T00:00:00Z',
        startedAt: '2024-05-02T00:00:01Z',
        completedAt: null,
      })

      const { wrapper } = await mountPage({
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
        jobId: 'job-1',
        translationStatus: 'queued',
        statusDetail: null,
        requestedAt: '2024-05-02T00:00:00Z',
        startedAt: null,
        completedAt: null,
      })

      const { wrapper } = await mountPage({
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
