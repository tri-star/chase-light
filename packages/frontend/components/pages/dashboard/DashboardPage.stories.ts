import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { http, HttpResponse } from 'msw'
import DashboardPage from './DashboardPage.vue'
import { getGetApiDataSourcesMockHandler } from '~/generated/api/backend.msw'
import type { DataSourceListResponse } from '~/generated/api/schemas'
import { expect, within } from '@storybook/test'

const meta: Meta<typeof DashboardPage> = {
  title: 'Components/Pages/DashboardPage',
  component: DashboardPage,
  parameters: {
    docs: {
      description: {
        component:
          'ダッシュボードページのメインコンポーネントです。ウォッチ中のリポジトリ一覧と統計情報を表示します。実際のAPIコールをMSWでモックして動作確認します。',
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

// より現実的なモックデータを生成する関数
const createRealisticMockResponse = (
  itemCount: number
): DataSourceListResponse => {
  const realisticRepos = [
    {
      name: 'awesome-vue',
      fullName: 'vuejs/awesome-vue',
      language: 'TypeScript',
      starsCount: 15420,
      description: 'A curated list of awesome things related to Vue.js',
    },
    {
      name: 'nuxt',
      fullName: 'nuxt/nuxt',
      language: 'TypeScript',
      starsCount: 52100,
      description: 'The Intuitive Vue Framework',
    },
    {
      name: 'pinia',
      fullName: 'vuejs/pinia',
      language: 'TypeScript',
      starsCount: 12800,
      description: 'Intuitive, type safe, light and flexible Store for Vue',
    },
    {
      name: 'vueuse',
      fullName: 'vueuse/vueuse',
      language: 'TypeScript',
      starsCount: 19500,
      description: 'Collection of essential Vue Composition Utilities',
    },
    {
      name: 'tailwindcss',
      fullName: 'tailwindlabs/tailwindcss',
      language: 'JavaScript',
      starsCount: 81200,
      description: 'A utility-first CSS framework',
    },
    {
      name: 'vitest',
      fullName: 'vitest-dev/vitest',
      language: 'TypeScript',
      starsCount: 12600,
      description: 'A blazing fast unit test framework',
    },
    {
      name: 'playwright',
      fullName: 'microsoft/playwright',
      language: 'TypeScript',
      starsCount: 65200,
      description: 'Playwright is a framework for Web Testing and Automation',
    },
    {
      name: 'prisma',
      fullName: 'prisma/prisma',
      language: 'TypeScript',
      starsCount: 38900,
      description: 'Next-generation Node.js and TypeScript ORM',
    },
  ]

  const items = Array.from(
    { length: Math.min(itemCount, realisticRepos.length) },
    (_, i) => {
      const repo = realisticRepos[i]
      return {
        dataSource: {
          id: `repo-${i + 1}`,
          sourceType: 'github',
          sourceId: `${i + 1}`,
          name: repo.name,
          description: repo.description,
          url: `https://github.com/${repo.fullName}`,
          isPrivate: false,
          repository: {
            id: `repo-${i + 1}`,
            githubId: i + 1,
            fullName: repo.fullName,
            language: repo.language,
            starsCount: repo.starsCount,
            forksCount: Math.floor(repo.starsCount / 10),
            openIssuesCount: Math.floor(Math.random() * 100),
            isFork: false,
            createdAt: new Date(
              Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
            updatedAt: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          createdAt: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        userWatch: {
          id: `watch-${i + 1}`,
          userId: 'user-123',
          dataSourceId: `repo-${i + 1}`,
          notificationEnabled: true,
          watchReleases: true,
          watchIssues: Math.random() > 0.5,
          watchPullRequests: Math.random() > 0.5,
          addedAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      }
    }
  )

  return {
    success: true,
    data: {
      items,
      pagination: {
        page: 1,
        perPage: 20,
        total: itemCount,
        totalPages: Math.ceil(itemCount / 20),
        hasNext: itemCount > 20,
        hasPrev: false,
      },
    },
  }
}

// MSWハンドラー設定
const successHandler = getGetApiDataSourcesMockHandler(
  createRealisticMockResponse(8)
)

const emptyHandler = http.get('*/api/data-sources', async () => {
  return HttpResponse.json(createRealisticMockResponse(0))
})

const loadingHandler = http.get('*/api/data-sources', async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return HttpResponse.json(createRealisticMockResponse(8))
})

const errorHandler = http.get('*/api/data-sources', async () => {
  return new HttpResponse(null, { status: 500 })
})

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [successHandler],
    },
  },
  // インタラクションテスト（Storybook Test Runnerで実行）
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('ページヘッダが表示される', async () => {
      await expect(await canvas.findByText('ダッシュボード')).toBeVisible()
      await expect(
        await canvas.findByText(
          'ウォッチ中のリポジトリの最新情報をチェックしましょう'
        )
      ).toBeVisible()
    })

    await step('統計カードとリストが描画される', async () => {
      await expect(
        await canvas.findByText('ウォッチ中リポジトリ')
      ).toBeVisible()
      // 合計数が8として表示される（モックの件数）
      await expect(await canvas.findByText('8')).toBeVisible()

      // リアルなダミーの一部が描画されていること
      await expect(await canvas.findByText('nuxt/nuxt')).toBeVisible()
      await expect(await canvas.findByText('vuejs/awesome-vue')).toBeVisible()
    })
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [loadingHandler],
    },
  },
}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [emptyHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByText('ウォッチ中のリポジトリがありません')
    ).toBeVisible()
  },
}

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [errorHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // エラー文言の表示
    await expect(
      await canvas.findByText('データの読み込みに失敗しました')
    ).toBeVisible()
  },
}

export const ManyRepositories: Story = {
  parameters: {
    msw: {
      handlers: [
        getGetApiDataSourcesMockHandler(createRealisticMockResponse(25)),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // 合計が25として表示される
    await expect(await canvas.findByText('25')).toBeVisible()
  },
}
