import { describe, test, expect, vi, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type {
  DataSourceListItem,
  DataSourceListResponseData,
} from '~/generated/api/schemas'

const fetchMock = vi.fn()

vi.mock(
  '~/features/data-sources/repositories/data-source-list-repository',
  () => ({
    DataSourceListRepository: vi.fn().mockImplementation(() => ({
      fetch: fetchMock,
    })),
  })
)

// データソース一覧のモックデータ生成
const createMockDataSourceListItem = (
  index: number,
  options: {
    watchReleases?: boolean
    watchIssues?: boolean
    watchPullRequests?: boolean
  } = {}
): DataSourceListItem => {
  const {
    watchReleases = true,
    watchIssues = true,
    watchPullRequests = true,
  } = options

  return {
    dataSource: {
      id: `ds-${index}`,
      name: `test-repo-${index}`,
      description: `Test repository ${index} description`,
      url: `https://github.com/owner/repo-${index}`,
      sourceType: 'github',
      sourceId: `${100000 + index}`,
      isPrivate: index === 1,
      repository: {
        id: `repo-${index}`,
        githubId: 100000 + index,
        fullName: `owner/repo-${index}`,
        language: index % 2 === 0 ? 'TypeScript' : 'JavaScript',
        starsCount: 100 * index,
        forksCount: 10 * index,
        openIssuesCount: 5 * index,
        isFork: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
    },
    userWatch: {
      id: `uw-${index}`,
      userId: 'user-1',
      dataSourceId: `ds-${index}`,
      notificationEnabled: true,
      watchReleases,
      watchIssues,
      watchPullRequests,
      addedAt: '2024-01-01T00:00:00Z',
    },
  }
}

const createMockResponseData = (
  itemCount: number,
  options: {
    hasNext?: boolean
    page?: number
    watchConfig?: { releases: boolean; issues: boolean; prs: boolean }
  } = {}
): DataSourceListResponseData => {
  const { hasNext = false, page = 1, watchConfig } = options

  return {
    items: Array.from({ length: itemCount }, (_, i) =>
      createMockDataSourceListItem(i + 1, {
        watchReleases: watchConfig?.releases ?? true,
        watchIssues: watchConfig?.issues ?? true,
        watchPullRequests: watchConfig?.prs ?? true,
      })
    ),
    pagination: {
      page,
      perPage: 20,
      total: hasNext ? itemCount * 2 : itemCount,
      totalPages: hasNext ? 2 : 1,
      hasNext,
      hasPrev: page > 1,
    },
  }
}

const mountPage = async () => {
  const Page = (await import('../DataSourceListPage.vue')).default
  return mountSuspended(Page)
}

afterEach(() => {
  vi.clearAllMocks()
  fetchMock.mockReset()
})

describe('DataSourceListPage', () => {
  describe('初期表示', () => {
    test('データソース一覧が正常に表示される', async () => {
      fetchMock.mockResolvedValue(createMockResponseData(3))

      const wrapper = await mountPage()

      // ヘッダーの確認
      expect(wrapper.text()).toContain('データソース一覧')

      // データソースアイテムの確認
      await vi.waitFor(
        () => {
          expect(
            wrapper.findAll('[data-testid="data-source-item"]').length
          ).toBeGreaterThan(0)
        },
        { timeout: 3000 }
      )
    })

    test('データソースが0件の場合、空メッセージが表示される', async () => {
      fetchMock.mockResolvedValue(createMockResponseData(0))

      const wrapper = await mountPage()

      await vi.waitFor(
        () => {
          expect(wrapper.text()).toContain('まだデータソースがありません')
        },
        { timeout: 3000 }
      )
    })
  })

  describe('検索機能', () => {
    test('検索フィールドが表示される', async () => {
      fetchMock.mockResolvedValue(createMockResponseData(3))

      const wrapper = await mountPage()

      const searchInput = wrapper.find(
        'input[placeholder*="データソースを検索"]'
      )
      expect(searchInput.exists()).toBe(true)
    })
  })

  describe('ソート機能', () => {
    test('ソート順選択ボタンが表示される', async () => {
      fetchMock.mockResolvedValue(createMockResponseData(3))

      const wrapper = await mountPage()

      expect(wrapper.text()).toContain('更新日時')
    })

    test('ソート順切り替えボタンが表示される', async () => {
      fetchMock.mockResolvedValue(createMockResponseData(3))

      const wrapper = await mountPage()

      expect(wrapper.text()).toContain('降順')
    })
  })

  describe('エラー処理', () => {
    test('API エラー時にエラーメッセージが表示される', async () => {
      fetchMock.mockRejectedValue(new Error('API Error'))

      const wrapper = await mountPage()

      await vi.waitFor(
        () => {
          expect(wrapper.text()).toContain('データソースの取得に失敗しました')
        },
        { timeout: 3000 }
      )
    })
  })

  describe('データソースアイテムの表示', () => {
    test('各データソースにリポジトリ名が表示される', async () => {
      fetchMock.mockResolvedValue(createMockResponseData(2))

      const wrapper = await mountPage()

      await vi.waitFor(
        () => {
          expect(wrapper.text()).toContain('owner/repo-1')
          expect(wrapper.text()).toContain('owner/repo-2')
        },
        { timeout: 3000 }
      )
    })

    test('ウォッチ状態バッジが表示される', async () => {
      fetchMock.mockResolvedValue(
        createMockResponseData(1, {
          watchConfig: { releases: true, issues: true, prs: true },
        })
      )

      const wrapper = await mountPage()

      await vi.waitFor(
        () => {
          // Release, PR, Issue のバッジが表示されることを確認
          expect(wrapper.text()).toContain('Release')
          expect(wrapper.text()).toContain('PR')
          expect(wrapper.text()).toContain('Issue')
        },
        { timeout: 3000 }
      )
    })
  })
})
