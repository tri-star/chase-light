import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { http, HttpResponse } from 'msw'
import DataSourceDetailPage from './DataSourceDetailPage.vue'
import type {
  DataSourceDetailResponse,
  DataSourceActivityListResponse,
} from '~/generated/api/schemas'
import { expect, within } from 'storybook/test'

const meta: Meta<typeof DataSourceDetailPage> = {
  title: 'Components/Pages/DataSourceDetailPage',
  component: DataSourceDetailPage,
  parameters: {
    docs: {
      description: {
        component:
          'データソース詳細ページのメインコンポーネントです。データソースのメタ情報とアクティビティ一覧を表示します。',
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
  args: {
    dataSourceId: 'ds-1',
  },
}

export default meta
type Story = StoryObj<typeof meta>

// モックデータ生成
const createDataSourceDetailResponse = (): DataSourceDetailResponse => ({
  success: true,
  data: {
    dataSource: {
      id: 'ds-1',
      sourceType: 'github',
      sourceId: '10270250',
      name: 'facebook/react',
      description:
        'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
      url: 'https://github.com/facebook/react',
      isPrivate: false,
      repository: {
        id: 'repo-1',
        githubId: 10270250,
        fullName: 'facebook/react',
        language: 'JavaScript',
        starsCount: 230000,
        forksCount: 47000,
        openIssuesCount: 1500,
        isFork: false,
        createdAt: '2013-05-24T16:15:54Z',
        updatedAt: '2024-12-01T12:00:00Z',
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-12-01T12:00:00Z',
    },
    userWatch: {
      id: 'watch-1',
      userId: 'user-1',
      dataSourceId: 'ds-1',
      notificationEnabled: true,
      watchReleases: true,
      watchIssues: true,
      watchPullRequests: false,
      addedAt: '2024-01-01T00:00:00Z',
    },
  },
})

const createDataSourceActivitiesResponse =
  (): DataSourceActivityListResponse => ({
    success: true,
    data: {
      dataSource: {
        id: 'ds-1',
        sourceType: 'github',
        name: 'facebook/react',
        url: 'https://github.com/facebook/react',
        metadata: {
          repositoryFullName: 'facebook/react',
          repositoryLanguage: 'JavaScript',
          starsCount: 230000,
          forksCount: 47000,
          openIssuesCount: 1500,
        },
      },
      items: [
        {
          activity: {
            id: 'activity-1',
            activityType: 'release',
            title: 'React v19.0.0',
            translatedTitle: 'React v19.0.0 - 新機能リリース',
            summary:
              '主な変更点: React Server Components、Actions、新しいフック',
            detail: null,
            translatedBody: null,
            status: 'completed',
            statusDetail: null,
            version: 'v19.0.0',
            occurredAt: '2024-12-01T10:00:00Z',
            lastUpdatedAt: '2024-12-01T10:30:00Z',
            source: {
              id: 'ds-1',
              sourceType: 'github',
              name: 'facebook/react',
              url: 'https://github.com/facebook/react',
              metadata: {
                repositoryFullName: 'facebook/react',
                repositoryLanguage: 'JavaScript',
                starsCount: 230000,
                forksCount: 47000,
                openIssuesCount: 1500,
              },
            },
          },
        },
        {
          activity: {
            id: 'activity-2',
            activityType: 'issue',
            title: 'Bug: Memory leak in useEffect cleanup',
            translatedTitle: 'バグ: useEffectクリーンアップでのメモリリーク',
            summary:
              'useEffectのクリーンアップ関数が正しく実行されない場合があります',
            detail: null,
            translatedBody: null,
            status: 'completed',
            statusDetail: null,
            version: null,
            occurredAt: '2024-11-30T08:00:00Z',
            lastUpdatedAt: '2024-11-30T09:00:00Z',
            source: {
              id: 'ds-1',
              sourceType: 'github',
              name: 'facebook/react',
              url: 'https://github.com/facebook/react',
              metadata: {
                repositoryFullName: 'facebook/react',
                repositoryLanguage: 'JavaScript',
                starsCount: 230000,
                forksCount: 47000,
                openIssuesCount: 1500,
              },
            },
          },
        },
        {
          activity: {
            id: 'activity-3',
            activityType: 'pull_request',
            title: 'feat: Add support for async server components',
            translatedTitle: '機能追加: 非同期サーバーコンポーネントのサポート',
            summary: 'Server Componentsで非同期処理がより簡潔に書けるように',
            detail: null,
            translatedBody: null,
            status: 'completed',
            statusDetail: null,
            version: null,
            occurredAt: '2024-11-29T14:00:00Z',
            lastUpdatedAt: '2024-11-29T16:00:00Z',
            source: {
              id: 'ds-1',
              sourceType: 'github',
              name: 'facebook/react',
              url: 'https://github.com/facebook/react',
              metadata: {
                repositoryFullName: 'facebook/react',
                repositoryLanguage: 'JavaScript',
                starsCount: 230000,
                forksCount: 47000,
                openIssuesCount: 1500,
              },
            },
          },
        },
      ],
      pagination: {
        page: 1,
        perPage: 20,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    },
  })

// デフォルト表示
export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/data-sources/ds-1', () => {
          return HttpResponse.json(createDataSourceDetailResponse())
        }),
        http.get('/api/data-sources/ds-1/activities', () => {
          return HttpResponse.json(createDataSourceActivitiesResponse())
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // データソース名が表示される
    const title = await canvas.findByText('facebook/react')
    expect(title).toBeInTheDocument()

    // アクティビティが表示される
    const releaseActivity = await canvas.findByText(
      'React v19.0.0 - 新機能リリース'
    )
    expect(releaseActivity).toBeInTheDocument()
  },
}

// アクティビティなし
export const NoActivities: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/data-sources/ds-1', () => {
          return HttpResponse.json(createDataSourceDetailResponse())
        }),
        http.get('/api/data-sources/ds-1/activities', () => {
          return HttpResponse.json({
            success: true,
            data: {
              dataSource: {
                id: 'ds-1',
                sourceType: 'github',
                name: 'facebook/react',
                url: 'https://github.com/facebook/react',
                metadata: {},
              },
              items: [],
              pagination: {
                page: 1,
                perPage: 20,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
              },
            },
          })
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 空状態が表示される
    const emptyMessage = await canvas.findByText(
      'このデータソースにはまだアクティビティがありません'
    )
    expect(emptyMessage).toBeInTheDocument()
  },
}

// エラー状態
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/data-sources/ds-1', () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'DATA_SOURCE_NOT_FOUND',
                message: 'データソースが見つかりません',
              },
            },
            { status: 404 }
          )
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // エラーメッセージが表示される
    const errorTitle = await canvas.findByText('ページが見つかりません')
    expect(errorTitle).toBeInTheDocument()
  },
}

// プライベートリポジトリ
export const PrivateRepository: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/data-sources/ds-1', () => {
          const response = createDataSourceDetailResponse()
          response.data.dataSource.isPrivate = true
          response.data.dataSource.name = 'my-org/private-repo'
          response.data.dataSource.description =
            'プライベートリポジトリです。社内向けのライブラリを管理しています。'
          response.data.dataSource.url =
            'https://github.com/my-org/private-repo'
          response.data.dataSource.repository!.starsCount = 5
          response.data.dataSource.repository!.fullName = 'my-org/private-repo'
          return HttpResponse.json(response)
        }),
        http.get('/api/data-sources/ds-1/activities', () => {
          return HttpResponse.json(createDataSourceActivitiesResponse())
        }),
      ],
    },
  },
}
