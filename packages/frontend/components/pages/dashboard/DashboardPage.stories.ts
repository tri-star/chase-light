import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { http, HttpResponse } from 'msw'
import { expect, within } from 'storybook/test'
import DashboardPage from './DashboardPage.vue'
import type {
  DataSourceListResponse,
  NotificationListResponse,
} from '~/generated/api/schemas'

const meta: Meta<typeof DashboardPage> = {
  title: 'Components/Pages/DashboardPage',
  component: DashboardPage,
  parameters: {
    docs: {
      description: {
        component:
          'ダッシュボードページのメインコンポーネントです。未読通知のダイジェスト一覧と統計カードを表示し、通知 API を MSW でモックして動作確認します。',
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

const createDataSourceResponse = (total: number): DataSourceListResponse => ({
  success: true,
  data: {
    items: [],
    pagination: {
      page: 1,
      perPage: 1,
      total,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  },
})

const createNotificationResponse = (
  overrides: Partial<NotificationListResponse> = {}
): NotificationListResponse => {
  const now = new Date('2025-10-28T09:00:00.000Z')

  const notifications: NotificationListResponse['data']['items'] = [
    {
      notification: {
        id: 'notification-1',
        type: 'digest',
        status: 'scheduled',
        isRead: false,
        scheduledAt: now.toISOString(),
        sentAt: null,
        createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
        lastActivityOccurredAt: new Date(
          now.getTime() - 30 * 60 * 1000
        ).toISOString(),
        metadata: null,
      },
      dataSources: [
        {
          id: 'source-1',
          name: 'nuxt/nuxt',
          url: 'https://github.com/nuxt/nuxt',
          sourceType: 'github',
          repository: {
            fullName: 'nuxt/nuxt',
          },
          groups: [
            {
              activityType: 'release',
              entries: [
                {
                  activityId: 'activity-1',
                  title: 'v3.12.0 リリース',
                  summary: 'Nuxt 3.12.0 が公開されました',
                  occurredAt: new Date(
                    now.getTime() - 50 * 60 * 1000
                  ).toISOString(),
                  url: 'https://github.com/nuxt/nuxt/releases/v3.12.0',
                  displayOrder: 0,
                },
              ],
            },
            {
              activityType: 'issue',
              entries: [
                {
                  activityId: 'activity-2',
                  title: 'docs: 誤記修正',
                  summary: 'ガイド内のリンク切れを修正しました',
                  occurredAt: new Date(
                    now.getTime() - 90 * 60 * 1000
                  ).toISOString(),
                  url: null,
                  displayOrder: 1,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      notification: {
        id: 'notification-2',
        type: 'digest',
        status: 'sent',
        isRead: true,
        scheduledAt: new Date(
          now.getTime() - 12 * 60 * 60 * 1000
        ).toISOString(),
        sentAt: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 13 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString(),
        lastActivityOccurredAt: new Date(
          now.getTime() - 11.5 * 60 * 60 * 1000
        ).toISOString(),
        metadata: null,
      },
      dataSources: [
        {
          id: 'source-2',
          name: 'vuejs/pinia',
          url: 'https://github.com/vuejs/pinia',
          sourceType: 'github',
          repository: {
            fullName: 'vuejs/pinia',
          },
          groups: [
            {
              activityType: 'pull_request',
              entries: [
                {
                  activityId: 'activity-3',
                  title: 'chore: CI を高速化',
                  summary: 'Vitest のキャッシュを導入してビルド時間を短縮',
                  occurredAt: new Date(
                    now.getTime() - 12 * 60 * 60 * 1000
                  ).toISOString(),
                  url: 'https://github.com/vuejs/pinia/pull/999',
                  displayOrder: 0,
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  return {
    success: true,
    data: {
      items: notifications,
      pageInfo: {
        hasNext: false,
      },
    },
    ...overrides,
  }
}

const notificationsHandler = (response: NotificationListResponse) =>
  http.get('*/api/notifications', () => HttpResponse.json(response))

const dataSourceHandler = (total: number) =>
  http.get('*/api/data-sources', () =>
    HttpResponse.json(createDataSourceResponse(total))
  )

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        notificationsHandler(createNotificationResponse()),
        dataSourceHandler(18),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('ページタイトルが表示される', async () => {
      await expect(await canvas.findByText('ダッシュボード')).toBeVisible()
      await expect(
        await canvas.findByText('未読の通知ダイジェストをまとめて確認できます')
      ).toBeVisible()
    })

    await step('通知カードが描画される', async () => {
      await expect(await canvas.findByText('nuxt/nuxt')).toBeVisible()
      await expect(await canvas.findByText('v3.12.0 リリース')).toBeVisible()
      await expect(await canvas.findByText('vuejs/pinia')).toBeVisible()
    })
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/api/notifications', async () => {
          await new Promise((resolve) => setTimeout(resolve, 1500))
          return HttpResponse.json(createNotificationResponse())
        }),
        dataSourceHandler(18),
      ],
    },
  },
}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        notificationsHandler(
          createNotificationResponse({
            data: {
              items: [],
              pageInfo: {
                hasNext: false,
              },
            },
          })
        ),
        dataSourceHandler(0),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('未読通知はありません')).toBeVisible()
  },
}

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(
          '*/api/notifications',
          () => new HttpResponse(null, { status: 500 })
        ),
        dataSourceHandler(18),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('再読み込み')).toBeVisible()
  },
}

export const WithNextPage: Story = {
  parameters: {
    msw: {
      handlers: [
        notificationsHandler(
          createNotificationResponse({
            data: {
              ...createNotificationResponse().data,
              pageInfo: {
                hasNext: true,
                nextCursor: 'cursor-2',
              },
            },
          })
        ),
        dataSourceHandler(42),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('もっと見る')).toBeVisible()
  },
}
