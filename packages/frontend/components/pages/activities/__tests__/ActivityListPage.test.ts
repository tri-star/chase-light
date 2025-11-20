import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import ActivityListPage from '../ActivityListPage.vue'
import type { ActivityListResponse } from '~/generated/api/schemas'
import { server } from '~/tests/setup/msw-server'
import { getGetApiActivitiesMockHandler } from '~/generated/api/backend.msw'

vi.mock('~/composables/use-infinite-scroll', () => {
  return {
    useInfiniteScroll: vi.fn(() => ({
      targetRef: { value: null },
      isLoading: ref(false),
      enable: vi.fn(),
      disable: vi.fn(),
      startListening: vi.fn(),
      stopListening: vi.fn(),
    })),
  }
})

describe('ActivityListPage', () => {
  const baseResponse: ActivityListResponse = {
    success: true,
    data: {
      items: [
        {
          activity: {
            id: 'activity-1',
            activityType: 'release',
            title: 'v1.0.0 released',
            translatedTitle: 'v1.0.0 をリリース',
            summary: '主な変更をまとめています',
            detail: null,
            translatedBody: null,
            status: 'completed',
            statusDetail: null,
            version: 'v1.0.0',
            occurredAt: '2024-01-01T00:00:00.000Z',
            lastUpdatedAt: '2024-01-01T01:00:00.000Z',
            source: {
              id: 'source-1',
              sourceType: 'github',
              name: 'octocat/hello-world',
              url: 'https://github.com/octocat/hello-world',
            },
          },
        },
      ],
      pagination: {
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    },
  }

  beforeEach(() => {
    server.use(getGetApiActivitiesMockHandler(baseResponse))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a list of activities from API response', async () => {
    const wrapper = await mountSuspended(ActivityListPage)
    await flushPromises()

    const items = wrapper.findAll('[data-testid="activity-item"]')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('v1.0.0')
  })

  it('appends activities when loadMoreActivities is called', async () => {
    const pagedResponse: ActivityListResponse = {
      ...baseResponse,
      data: {
        ...baseResponse.data,
        pagination: {
          ...baseResponse.data.pagination,
          hasNext: true,
          total: 2,
          totalPages: 2,
        },
      },
    }

    const nextPageResponse: ActivityListResponse = {
      success: true,
      data: {
        items: [
          {
            activity: {
              id: 'activity-2',
              activityType: 'issue',
              title: 'Fix bug',
              translatedTitle: null,
              summary: 'Issue summary',
              detail: null,
              translatedBody: null,
              status: 'completed',
              statusDetail: null,
              version: null,
              occurredAt: '2024-01-02T00:00:00.000Z',
              lastUpdatedAt: '2024-01-02T01:00:00.000Z',
              source: {
                id: 'source-2',
                sourceType: 'github',
                name: 'octocat/example',
                url: 'https://github.com/octocat/example',
              },
            },
          },
        ],
        pagination: {
          page: 2,
          perPage: 20,
          total: 2,
          totalPages: 2,
          hasNext: false,
          hasPrev: true,
        },
      },
    }

    server.use(
      getGetApiActivitiesMockHandler((info) => {
        const url = new URL(info.request.url)
        const page = Number(url.searchParams.get('page') ?? '1')
        return page === 1 ? pagedResponse : nextPageResponse
      })
    )

    const wrapper = await mountSuspended(ActivityListPage)
    await flushPromises()

    type ActivityListVm = {
      loadMoreActivities: () => Promise<void>
    }

    const vm = wrapper.vm as unknown as ActivityListVm
    await vm.loadMoreActivities()
    await flushPromises()

    const items = wrapper.findAll('[data-testid="activity-item"]')
    expect(items).toHaveLength(2)
    expect(items[1].text()).toContain('Fix bug')
  })
})
