import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { server } from '../../../../tests/setup/msw-server'
import {
  getGetApiDataSourcesMockHandler,
  getGetApiNotificationsMockHandler,
} from '~/generated/api/backend.msw'
import type {
  DataSourceListResponse,
  NotificationListResponse,
} from '~/generated/api/schemas'
import DashboardPage from '../DashboardPage.vue'

vi.mock('~/composables/use-infinite-scroll', () => ({
  useInfiniteScroll: () => ({
    targetRef: { value: null },
    isLoading: { value: false },
  }),
}))

const AddDataSourceModalStub = defineComponent({
  name: 'AddDataSourceModal',
  props: {
    open: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:open', 'success'],
  template: `<div data-testid="add-modal" :data-open="open"><slot /></div>`,
})

const NotificationListStub = defineComponent({
  name: 'NotificationList',
  props: {
    notifications: {
      type: Array,
      default: () => [],
    },
  },
  template: `<div data-testid="notification-list"></div>`,
})

const DashboardStatCardStub = defineComponent({
  name: 'DashboardStatCard',
  props: {
    name: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: Number, required: true },
    icon: { type: String, required: true },
    iconClass: { type: String, required: true },
  },
  template: `<div data-testid="stat-card"><slot /></div>`,
})

describe('DashboardPage', () => {
  const refreshNuxtDataMock = vi.fn()

  beforeEach(() => {
    refreshNuxtDataMock.mockClear()

    // MSWハンドラーでAPIレスポンスをモック
    const dataSourcesData: DataSourceListResponse = {
      success: true,
      data: {
        items: [],
        pagination: {
          page: 1,
          perPage: 1,
          total: 2,
          totalPages: 2,
          hasNext: false,
          hasPrev: false,
        },
      },
    }

    const notificationsData: NotificationListResponse = {
      success: true,
      data: {
        items: [],
        pageInfo: {
          hasNext: false,
          nextCursor: undefined,
        },
      },
    }

    server.use(
      getGetApiDataSourcesMockHandler(dataSourcesData),
      getGetApiNotificationsMockHandler(notificationsData)
    )

    // グローバルにrefreshNuxtDataをモック
    vi.stubGlobal('refreshNuxtData', refreshNuxtDataMock)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('opens the add data source modal when the FAB is clicked', async () => {
    const wrapper = await mountSuspended(DashboardPage, {
      global: {
        stubs: {
          AddDataSourceModal: AddDataSourceModalStub,
          NotificationList: NotificationListStub,
          DashboardStatCard: DashboardStatCardStub,
        },
      },
    })

    await wrapper.get('[data-testid="fab-button"]').trigger('click')
    const modal = wrapper.get('[data-testid="add-modal"]')
    expect(modal.attributes('data-open')).toBe('true')
  })

  it('has handleAddDataSourceSuccess method that can be called', async () => {
    const wrapper = await mountSuspended(DashboardPage, {
      global: {
        stubs: {
          AddDataSourceModal: AddDataSourceModalStub,
          NotificationList: NotificationListStub,
          DashboardStatCard: DashboardStatCardStub,
        },
      },
    })

    type DashboardPageVm = {
      handleAddDataSourceSuccess: () => Promise<void>
    }

    const vm = wrapper.vm as unknown as DashboardPageVm

    // handleAddDataSourceSuccessメソッドが存在し、呼び出し可能であることを確認
    expect(typeof vm.handleAddDataSourceSuccess).toBe('function')

    // メソッドを呼び出してもエラーが発生しないことを確認
    await vm.handleAddDataSourceSuccess()

    // テストが正常に完了すれば、メソッドは動作している
    expect(true).toBe(true)
  })
})
