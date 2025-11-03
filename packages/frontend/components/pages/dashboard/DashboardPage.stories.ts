import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { http, HttpResponse } from 'msw'
import DashboardPage from './DashboardPage.vue'
import {
  getGetApiDataSourcesMockHandler,
  getGetApiNotificationsMockHandler,
} from '~/generated/api/backend.msw'
import type {
  DataSourceListResponse,
  NotificationListResponse,
} from '~/generated/api/schemas'
import { expect, within } from 'storybook/test'

const meta: Meta<typeof DashboardPage> = {
  title: 'Components/Pages/DashboardPage',
  component: DashboardPage,
  parameters: {
    docs: {
      description: {
        component:
          'ダッシュボードページのメインコンポーネントです。新着通知一覧と統計情報を表示します。実際のAPIコールをMSWでモックして動作確認します。',
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    () => ({
      template: `
        <div>
          <Suspense>
            <template #default>
              <story />
            </template>
            <template #fallback>
              <div class="flex items-center justify-center min-h-screen">
                <div class="text-lg">読み込み中...</div>
              </div>
            </template>
          </Suspense>
        </div>
      `,
    }),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// データソース統計用のモックレスポンス
const createDataSourcesResponse = (total: number): DataSourceListResponse => {
  return {
    success: true,
    data: {
      items: [],
      pagination: {
        page: 1,
        perPage: 1,
        total,
        totalPages: total,
        hasNext: false,
        hasPrev: false,
      },
    },
  }
}

// 通知用のモックレスポンス
const createNotificationsResponse = (
  itemCount: number
): NotificationListResponse => {
  const now = new Date(2025, 11, 1, 12, 0, 0, 0)
  const mockItems = [
    {
      dataSource: {
        name: 'facebook/react',
        url: 'https://github.com/facebook/react',
      },
      groups: [
        {
          activityType: 'release' as const,
          entries: [
            {
              title: 'React 19.0.0 リリース',
              summary: 'React 19の新機能が多数追加されました',
              occurredAt: new Date(now.getTime() - 3600000).toISOString(), // 1時間前
            },
          ],
        },
      ],
    },
    {
      dataSource: {
        name: 'vuejs/core',
        url: 'https://github.com/vuejs/core',
      },
      groups: [
        {
          activityType: 'issue' as const,
          entries: [
            {
              title: 'Vue 3.5でのパフォーマンス改善',
              summary: 'レンダリング速度が大幅に向上しました',
              occurredAt: new Date(now.getTime() - 7200000).toISOString(), // 2時間前
            },
          ],
        },
      ],
    },
    {
      dataSource: {
        name: 'nuxt/nuxt',
        url: 'https://github.com/nuxt/nuxt',
      },
      groups: [
        {
          activityType: 'pull_request' as const,
          entries: [
            {
              title: 'Nuxt 4でのTypeScript強化',
              summary: '型安全性が向上しました',
              occurredAt: new Date(now.getTime() - 10800000).toISOString(), // 3時間前
            },
          ],
        },
      ],
    },
  ]

  const items = Array.from({ length: Math.min(itemCount, 10) }, (_, i) => {
    const mock = mockItems[i % mockItems.length]
    return {
      notification: {
        id: `notif-${i + 1}`,
        type: 'activity_digest',
        status: 'sent',
        isRead: i % 3 === 0,
        scheduledAt: new Date(now.getTime() - 86400000).toISOString(), // 1日前
        sentAt: new Date(now.getTime() - 82800000).toISOString(), // 23時間前
        createdAt: new Date(now.getTime() - 86400000).toISOString(), // 1日前
        updatedAt: new Date(now.getTime() - 82800000).toISOString(), // 23時間前
        lastActivityOccurredAt: new Date(
          now.getTime() - 3600000 * i
        ).toISOString(),
        metadata: {},
      },
      dataSources: [
        {
          id: `ds-${i + 1}`,
          name: mock.dataSource.name,
          url: mock.dataSource.url,
          sourceType: 'github_repository',
          repository: {
            fullName: mock.dataSource.name,
          },
          groups: mock.groups.map((group) => ({
            activityType: group.activityType,
            entries: group.entries.map((entry, entryIdx) => ({
              activityId: `act-${i + 1}-${entryIdx}`,
              title: entry.title,
              summary: entry.summary,
              occurredAt: entry.occurredAt,
              url: `${mock.dataSource.url}/releases/tag/v1.0.0`,
              displayOrder: entryIdx,
            })),
          })),
        },
      ],
    }
  })

  return {
    success: true,
    data: {
      items,
      pageInfo: {
        hasNext: itemCount > 10,
        nextCursor: itemCount > 10 ? 'next-cursor' : undefined,
      },
    },
  }
}

// MSWハンドラー設定
const dataSourcesSuccessHandler = getGetApiDataSourcesMockHandler(
  createDataSourcesResponse(8)
)

const notificationsSuccessHandler = getGetApiNotificationsMockHandler(
  createNotificationsResponse(5)
)

const notificationsEmptyHandler = http.get('*/api/notifications', async () => {
  return HttpResponse.json(createNotificationsResponse(0))
})

const notificationsLoadingHandler = http.get(
  '*/api/notifications',
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return HttpResponse.json(createNotificationsResponse(5))
  }
)

const notificationsErrorHandler = http.get('*/api/notifications', async () => {
  return new HttpResponse(null, { status: 500 })
})

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [dataSourcesSuccessHandler, notificationsSuccessHandler],
    },
  },
  // インタラクションテスト（Storybook Test Runnerで実行）
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('統計カードと通知リストが描画される', async () => {
      await expect(
        await canvas.findByText('ウォッチ中リポジトリ')
      ).toBeVisible()
      await expect(await canvas.findByText('8')).toBeVisible()

      await expect(await canvas.findByText('未読通知')).toBeVisible()

      // 通知の内容が表示される
      await expect(
        await canvas.findByText('React 19.0.0 リリース')
      ).toBeVisible()
      await expect(await canvas.findByText('facebook/react')).toBeVisible()
    })
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [dataSourcesSuccessHandler, notificationsLoadingHandler],
    },
  },
}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [dataSourcesSuccessHandler, notificationsEmptyHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByText('新しい通知はありません')
    ).toBeVisible()
  },
}

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [dataSourcesSuccessHandler, notificationsErrorHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // エラー文言の表示
    await expect(
      await canvas.findByText('通知の読み込みに失敗しました')
    ).toBeVisible()
  },
}

export const ManyNotifications: Story = {
  parameters: {
    msw: {
      handlers: [
        getGetApiDataSourcesMockHandler(createDataSourcesResponse(25)),
        getGetApiNotificationsMockHandler(createNotificationsResponse(11)),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // データソース数が25として表示される
    await expect(await canvas.findByText('25')).toBeVisible()
    // 通知が10件表示される（hasNextがtrueで無限スクロールが有効）
    await expect(await canvas.findByText('React 19.0.0 リリース')).toBeVisible()
  },
}
