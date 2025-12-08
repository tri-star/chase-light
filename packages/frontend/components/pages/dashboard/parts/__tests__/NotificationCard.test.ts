import { describe, test, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import NotificationCard from '../NotificationCard.vue'
import type { NotificationListItem } from '~/generated/api/schemas'

const createMockNotification = (
  overrides: Partial<NotificationListItem> = {}
): NotificationListItem => {
  return {
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
                title: 'React 19.0.0 リリース',
                summary: 'React 19の新機能が多数追加されました',
                occurredAt: '2025-10-28T09:00:00Z',
                url: 'https://github.com/facebook/react/releases/tag/v19.0.0',
                displayOrder: 0,
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('NotificationCard', () => {
  test('通知カードが正常に表示される', () => {
    const item = createMockNotification()
    const wrapper = mount(NotificationCard, {
      props: { item },
    })

    expect(wrapper.text()).toContain('React 19.0.0 リリース')
  })

  test('データソース名とリンクが表示される', () => {
    const item = createMockNotification()
    const wrapper = mount(NotificationCard, {
      props: { item },
      global: {
        stubs: {
          NuxtLink: RouterLinkStub,
        },
      },
    })

    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('facebook/react')
    expect(link.props('to')).toBe('/data-sources/ds-1')
  })

  test('アクティビティグループ別にラベルが表示される', () => {
    const item = createMockNotification()
    const wrapper = mount(NotificationCard, {
      props: { item },
    })

    const groupLabel = wrapper.find('[data-id="activity-group-label"]')
    expect(groupLabel.exists()).toBe(true)
    expect(groupLabel.text()).toBe('リリース')
  })

  test('アクティビティエントリのタイトルと要約が表示される', () => {
    const item = createMockNotification()
    const wrapper = mount(NotificationCard, {
      props: { item },
    })

    const title = wrapper.find('[data-id="activity-title"]')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('React 19.0.0 リリース')
    expect(wrapper.text()).toContain('React 19の新機能が多数追加されました')
  })

  test('アクティビティエントリのURLリンクが正しく表示される', () => {
    const item = createMockNotification()
    const wrapper = mount(NotificationCard, {
      props: { item },
    })

    const activityLink = wrapper.find('[data-id="activity-title"]')
    expect(activityLink.exists()).toBe(true)
    expect(activityLink.element.tagName).toBe('A')
    expect(activityLink.attributes('href')).toBe(
      'https://github.com/facebook/react/releases/tag/v19.0.0'
    )
    expect(activityLink.text()).toBe('React 19.0.0 リリース')
  })

  test('URLがnullの場合はリンクではなくテキストとして表示される', () => {
    const item = createMockNotification({
      dataSources: [
        {
          id: 'ds-1',
          name: 'test/repo',
          url: 'https://github.com/test/repo',
          sourceType: 'github_repository',
          repository: {
            fullName: 'test/repo',
          },
          groups: [
            {
              activityType: 'issue',
              entries: [
                {
                  activityId: 'act-1',
                  title: 'テストイシュー',
                  summary: 'サマリー',
                  occurredAt: '2025-10-28T09:00:00Z',
                  url: null,
                  displayOrder: 0,
                },
              ],
            },
          ],
        },
      ],
    })
    const wrapper = mount(NotificationCard, {
      props: { item },
    })

    const titleEl = wrapper.find('[data-id="activity-title"]')
    expect(titleEl.exists()).toBe(true)
    // URLがnullのときはリンクではなくテキスト
    expect(titleEl.element.tagName).not.toBe('A')
    expect(titleEl.text()).toBe('テストイシュー')
  })

  test('複数のアクティビティグループが表示される', () => {
    const item = createMockNotification({
      dataSources: [
        {
          id: 'ds-1',
          name: 'test/repo',
          url: 'https://github.com/test/repo',
          sourceType: 'github_repository',
          repository: {
            fullName: 'test/repo',
          },
          groups: [
            {
              activityType: 'release',
              entries: [
                {
                  activityId: 'act-1',
                  title: 'リリース1',
                  summary: 'サマリー1',
                  occurredAt: '2025-10-28T09:00:00Z',
                  url: null,
                  displayOrder: 0,
                },
              ],
            },
            {
              activityType: 'issue',
              entries: [
                {
                  activityId: 'act-2',
                  title: 'イシュー1',
                  summary: 'サマリー2',
                  occurredAt: '2025-10-28T09:00:00Z',
                  url: null,
                  displayOrder: 0,
                },
              ],
            },
          ],
        },
      ],
    })
    const wrapper = mount(NotificationCard, {
      props: { item },
    })

    const labels = wrapper.findAll('[data-id="activity-group-label"]')
    const labelTexts = labels.map((l) => l.text())
    expect(labelTexts).toContain('リリース')
    expect(labelTexts).toContain('Issue')
  })

  test('アクティビティエントリが6件以上の場合は最大5件までしか表示されない', () => {
    const entries = Array.from({ length: 7 }, (_, i) => ({
      activityId: `act-${i}`,
      title: `エントリ${i + 1}`,
      summary: `サマリー${i + 1}`,
      occurredAt: '2025-10-28T09:00:00Z',
      url: null,
      displayOrder: i,
    }))

    const item = createMockNotification({
      dataSources: [
        {
          id: 'ds-1',
          name: 'test/repo',
          url: 'https://github.com/test/repo',
          sourceType: 'github_repository',
          repository: {
            fullName: 'test/repo',
          },
          groups: [
            {
              activityType: 'release',
              entries,
            },
          ],
        },
      ],
    })
    const wrapper = mount(NotificationCard, {
      props: { item },
    })

    const titles = wrapper.findAll('[data-id="activity-title"]')
    expect(titles.length).toBe(5)
    // 先頭と末尾のタイトルが見えること
    expect(titles[0].text()).toContain('エントリ1')
    expect(titles[4].text()).toContain('エントリ5')
    // 6件目は表示されない
    const allText = wrapper.text()
    expect(allText).not.toContain('エントリ6')
    expect(wrapper.text()).toContain('他 2 件')
  })

  test('複数のデータソースがある場合は全て表示される', () => {
    const item = createMockNotification({
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
                  url: null,
                  displayOrder: 0,
                },
              ],
            },
          ],
        },
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
              activityType: 'release',
              entries: [
                {
                  activityId: 'act-2',
                  title: 'Vue 3.5.0',
                  summary: 'サマリー',
                  occurredAt: '2025-10-28T09:00:00Z',
                  url: null,
                  displayOrder: 0,
                },
              ],
            },
          ],
        },
      ],
    })
    const wrapper = mount(NotificationCard, {
      props: { item },
      global: {
        stubs: {
          NuxtLink: RouterLinkStub,
        },
      },
    })

    const srcLinks = wrapper.findAll('[data-id="data-source-link"]')
    expect(srcLinks.length).toBe(2)
    const texts = srcLinks.map((n) => n.text())
    expect(texts.join(' ')).toContain('facebook/react')
    expect(texts.join(' ')).toContain('vuejs/core')
  })
})
