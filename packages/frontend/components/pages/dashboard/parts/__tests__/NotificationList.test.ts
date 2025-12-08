import { describe, test, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import NotificationList from '../NotificationList.vue'
import type { NotificationListItem } from '~/generated/api/schemas'
import NotificationCard from '~/components/pages/dashboard/parts/NotificationCard.vue'

const createMockNotifications = (): NotificationListItem[] => {
  return [
    {
      notification: {
        id: 'notif-1',
        type: 'activity_digest',
        status: 'sent',
        isRead: false,
        scheduledAt: '2025-10-28T10:00:00Z',
        sentAt: '2025-10-28T10:05:00Z',
        createdAt: '2025-10-28T09:00:00Z',
        updatedAt: '2025-10-28T10:05:00Z',
        lastActivityOccurredAt: '2025-10-28T09:30:00Z',
        metadata: {},
      },
      dataSources: [
        {
          id: 'ds-1',
          name: 'facebook/react',
          url: 'https://github.com/facebook/react',
          sourceType: 'github_repository',
          repository: {
            fullName: 'facebook/react',
          },
          groups: [
            {
              activityType: 'release',
              entries: [
                {
                  activityId: 'act-1',
                  title: 'React 19.0.0',
                  summary: 'サマリー',
                  occurredAt: '2025-10-28T09:00:00Z',
                  url: 'https://github.com/facebook/react/releases/tag/v19.0.0',
                  displayOrder: 0,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      notification: {
        id: 'notif-2',
        type: 'activity_digest',
        status: 'sent',
        isRead: true,
        scheduledAt: '2025-10-27T10:00:00Z',
        sentAt: '2025-10-27T10:05:00Z',
        createdAt: '2025-10-27T09:00:00Z',
        updatedAt: '2025-10-27T10:05:00Z',
        lastActivityOccurredAt: '2025-10-27T09:30:00Z',
        metadata: {},
      },
      dataSources: [
        {
          id: 'ds-2',
          name: 'vuejs/core',
          url: 'https://github.com/vuejs/core',
          sourceType: 'github_repository',
          repository: {
            fullName: 'vuejs/core',
          },
          groups: [
            {
              activityType: 'issue',
              entries: [
                {
                  activityId: 'act-2',
                  title: 'Vue Issue #1234',
                  summary: 'サマリー',
                  occurredAt: '2025-10-27T09:00:00Z',
                  url: null,
                  displayOrder: 0,
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}

describe('NotificationList', () => {
  test('通知一覧が正常に表示される', () => {
    const notifications = createMockNotifications()
    const wrapper = mount(NotificationList, {
      props: { notifications },
    })

    const cards = wrapper.findAllComponents(NotificationCard)
    expect(cards.length).toBe(2)
  })

  test('ローディング状態が正しく表示される', () => {
    const wrapper = mount(NotificationList, {
      props: { loading: true },
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('新しい通知はありません')
  })

  test('エラー状態が正しく表示される', () => {
    const wrapper = mount(NotificationList, {
      props: { error: 'ネットワークエラー' },
    })

    expect(wrapper.text()).toContain('通知の読み込みに失敗しました')
    expect(wrapper.text()).toContain('ネットワークエラー')
    expect(wrapper.find('.text-status-alert-default').exists()).toBe(true)
  })

  test('空の状態が正しく表示される', () => {
    const wrapper = mount(NotificationList, {
      props: { notifications: [] },
    })

    expect(wrapper.text()).toContain('新しい通知はありません')
    expect(wrapper.text()).toContain(
      'ウォッチ中のリポジトリで新しいアクティビティがあると、ここに通知が表示されます。'
    )
  })

  test('通知が0件の場合はローディングやエラーが表示されない', () => {
    const wrapper = mount(NotificationList, {
      props: { notifications: [], loading: false, error: undefined },
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('通知の読み込みに失敗しました')
  })

  test('ローディング中はエラーメッセージが表示されない', () => {
    const wrapper = mount(NotificationList, {
      props: { loading: true, error: 'エラー' },
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('通知の読み込みに失敗しました')
  })

  test('複数の通知が正しい順序で表示される', () => {
    const notifications = createMockNotifications()
    const wrapper = mount(NotificationList, {
      props: { notifications },
      global: {
        stubs: {
          NuxtLink: RouterLinkStub,
        },
      },
    })

    const text = wrapper.text()
    const reactIndex = text.indexOf('facebook/react')
    const vueIndex = text.indexOf('vuejs/core')

    expect(reactIndex).toBeLessThan(vueIndex)
  })
})
