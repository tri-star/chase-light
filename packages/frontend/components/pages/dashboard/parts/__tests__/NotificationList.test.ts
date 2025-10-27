import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationList from '../NotificationList.vue'
import type { NotificationListItemViewModel } from '~/features/notifications/models/notification'

const originalIntersectionObserver = globalThis.IntersectionObserver

const createNotification = (
  overrides: Partial<NotificationListItemViewModel> = {}
): NotificationListItemViewModel => ({
  id: 'notification-1',
  type: 'digest',
  status: 'queued',
  isRead: false,
  scheduledAt: '2025-10-28T08:00:00.000Z',
  sentAt: null,
  displayTimestamp: '2025-10-28T08:00:00.000Z',
  displayTimestampLabel: '2025/10/28 17:00',
  lastActivityOccurredAt: '2025-10-28T06:30:00.000Z',
  lastActivityOccurredAtLabel: '2025/10/28 15:30',
  dataSources: [
    {
      id: 'source-1',
      name: 'nuxt/nuxt',
      url: 'https://github.com/nuxt/nuxt',
      sourceType: 'github',
      repositoryFullName: 'nuxt/nuxt',
      groups: [
        {
          activityType: 'release',
          activityLabel: 'リリース',
          entries: [
            {
              id: 'activity-1',
              title: 'v3.12.0 リリース',
              summary: 'Nuxt 3.12.0 がリリースされました',
              occurredAt: '2025-10-27T23:00:00.000Z',
              occurredAtLabel: '2025/10/28 08:00',
              url: 'https://github.com/nuxt/nuxt/releases/v3.12.0',
            },
          ],
        },
        {
          activityType: 'issue',
          activityLabel: 'Issue',
          entries: [
            {
              id: 'activity-2',
              title: 'TypeScript の型警告を解消',
              summary: '型定義の修正により警告が解消されました',
              occurredAt: '2025-10-27T15:00:00.000Z',
              occurredAtLabel: '2025/10/27 24:00',
              url: null,
            },
          ],
        },
      ],
    },
  ],
  ...overrides,
})

const mountComponent = (props: Record<string, unknown> = {}) => {
  return mount(NotificationList, {
    props: {
      notifications: [createNotification()],
      ...props,
    },
  })
}

describe('NotificationList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalIntersectionObserver) {
      globalThis.IntersectionObserver = originalIntersectionObserver
    } else {
      delete (globalThis as { IntersectionObserver?: unknown })
        .IntersectionObserver
    }
  })

  test('通知の内容がデータソース・グループ・エントリと共に表示される', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('nuxt/nuxt')
    expect(wrapper.text()).toContain('リリース')
    expect(wrapper.text()).toContain('v3.12.0 リリース')
    expect(wrapper.text()).toContain('TypeScript の型警告を解消')
    expect(
      wrapper.find('a[href="https://github.com/nuxt/nuxt"]').exists()
    ).toBe(true)
    expect(
      wrapper
        .find('a[href="https://github.com/nuxt/nuxt/releases/v3.12.0"]')
        .attributes('rel')
    ).toBe('noopener noreferrer')
  })

  test('initialLoading が true の場合はスケルトンが表示される', () => {
    const wrapper = mountComponent({
      notifications: [],
      initialLoading: true,
    })

    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  test('エラー状態ではメッセージと再読み込みボタンが表示され、クリックで retry イベントが発火する', async () => {
    const wrapper = mountComponent({
      notifications: [],
      error: '通知の取得に失敗しました',
    })

    expect(wrapper.text()).toContain('通知の取得に失敗しました')

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  test('通知が空の場合は空状態メッセージを表示する', () => {
    const wrapper = mountComponent({
      notifications: [],
    })

    expect(wrapper.text()).toContain('未読通知はありません')
  })

  test('もっと見るボタンで load-more イベントを発火させる', async () => {
    const wrapper = mountComponent({
      hasNextPage: true,
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('load-more')).toBeTruthy()
  })

  test('IntersectionObserver が利用可能な場合はセンチネル到達で load-more を発火する', async () => {
    const observe = vi.fn()
    const unobserve = vi.fn()

    class IntersectionObserverStub {
      static latest: IntersectionObserverStub | null = null

      private target: Element | null = null
      private readonly cb: IntersectionObserverCallback

      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb
        IntersectionObserverStub.latest = this
      }

      observe(element: Element) {
        this.target = element
        observe(element)
      }

      unobserve(element: Element) {
        unobserve(element)
      }

      disconnect() {
        /* noop */
      }

      trigger(isIntersecting = true) {
        if (!this.target) {
          return
        }
        this.cb(
          [
            {
              isIntersecting,
              target: this.target,
            } as IntersectionObserverEntry,
          ],
          this as unknown as IntersectionObserver
        )
      }
    }

    Object.assign(globalThis, {
      IntersectionObserver: IntersectionObserverStub,
    })

    const wrapper = mountComponent({
      hasNextPage: true,
    })

    expect(observe).toHaveBeenCalled()

    IntersectionObserverStub.latest?.trigger()

    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('load-more')).toBeTruthy()
  })

  test('loadMoreError が指定された場合はエラーメッセージを表示する', () => {
    const wrapper = mountComponent({
      hasNextPage: true,
      loadMoreError: '追加取得に失敗しました',
    })

    expect(wrapper.text()).toContain('追加取得に失敗しました')
  })
})
