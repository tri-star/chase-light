import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type {
  DataSourceDetail,
  DataSourceActivityListResponseData,
} from '~/features/data-sources/domain/data-source-detail'

const dataSourceId = 'ds-1'
const detailFetchMock = vi.fn()
const activitiesFetchMock = vi.fn()

vi.mock(
  '~/features/data-sources/repositories/data-source-detail-repository',
  () => {
    return {
      DataSourceDetailRepository: vi.fn().mockImplementation(() => ({
        fetch: detailFetchMock,
      })),
    }
  }
)

vi.mock(
  '~/features/data-sources/repositories/data-source-activities-repository',
  () => {
    return {
      DataSourceActivitiesRepository: vi.fn().mockImplementation(() => ({
        fetch: activitiesFetchMock,
      })),
    }
  }
)

const buildDataSourceDetail = (
  override?: Partial<DataSourceDetail>
): DataSourceDetail => ({
  dataSource: {
    id: 'ds-1',
    sourceType: 'github',
    sourceId: '12345',
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
    watchIssues: false,
    watchPullRequests: false,
    addedAt: '2024-01-01T00:00:00Z',
  },
  ...override,
})

const buildActivitiesData = (
  override?: Partial<DataSourceActivityListResponseData>
): DataSourceActivityListResponseData => ({
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
        title: 'v19.0.0',
        translatedTitle: 'React v19.0.0 リリース',
        summary: '新しいReactリリースです',
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
        title: 'Bug: Memory leak in useEffect',
        translatedTitle: 'バグ: useEffectでのメモリリーク',
        summary: 'useEffectでメモリリークが発生しています',
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
  ],
  pagination: {
    page: 1,
    perPage: 20,
    total: 2,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
  ...override,
})

const mountPage = async (
  detailOverride?: Partial<DataSourceDetail>,
  activitiesOverride?: Partial<DataSourceActivityListResponseData>
) => {
  detailFetchMock.mockResolvedValue(buildDataSourceDetail(detailOverride))
  activitiesFetchMock.mockResolvedValue(buildActivitiesData(activitiesOverride))

  const Page = (
    await import(
      '~/components/pages/data-sources/detail/DataSourceDetailPage.vue'
    )
  ).default
  return mountSuspended(Page, {
    props: {
      dataSourceId,
    },
  })
}

afterEach(() => {
  vi.clearAllMocks()
  detailFetchMock.mockReset()
  activitiesFetchMock.mockReset()
})

describe('DataSourceDetailPage', () => {
  it('データソース詳細情報を表示する', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('facebook/react')
    expect(wrapper.text()).toContain(
      'A declarative, efficient, and flexible JavaScript library for building user interfaces.'
    )
    expect(wrapper.text()).toContain('230,000')
    expect(wrapper.text()).toContain('JavaScript')
  })

  it('アクティビティ一覧を表示する', async () => {
    const wrapper = await mountPage()

    // lazyなデータ取得を待つ
    await flushPromises()

    expect(wrapper.text()).toContain('React v19.0.0 リリース')
    expect(wrapper.text()).toContain('バグ: useEffectでのメモリリーク')
    expect(wrapper.text()).toContain('リリース')
    expect(wrapper.text()).toContain('Issue')
  })

  it('アクティビティがない場合は空状態を表示する', async () => {
    const wrapper = await mountPage(undefined, {
      items: [],
      pagination: {
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    })

    // lazyなデータ取得を待つ
    await flushPromises()

    expect(wrapper.text()).toContain(
      'このデータソースにはまだアクティビティがありません'
    )
  })

  it('外部リンクが正しく設定される', async () => {
    const wrapper = await mountPage()

    const link = wrapper.find('a[target="_blank"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://github.com/facebook/react')
  })

  it('ウォッチ設定が表示される', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('リリース')
  })
})
