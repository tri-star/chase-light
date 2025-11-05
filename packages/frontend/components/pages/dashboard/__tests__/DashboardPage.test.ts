import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import DashboardPage from '../DashboardPage.vue'

const useFetchMock = vi.fn()

vi.mock('#app', () => ({
  useFetch: (...args: unknown[]) => useFetchMock(...args),
}))

vi.mock('~/composables/use-infinite-scroll', () => ({
  useInfiniteScroll: () => ({
    targetRef: ref(null),
    isLoading: ref(false),
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
    const dataSourcesData = ref({
      success: true,
      data: {
        pagination: {
          total: 2,
        },
      },
    })
    const notificationsData = ref({
      success: true,
      data: {
        items: [],
        pageInfo: {
          hasNext: false,
          nextCursor: undefined,
        },
      },
    })

    useFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/data-sources') {
        return {
          data: dataSourcesData,
          pending: ref(false),
          error: ref(null),
          refresh: vi.fn(),
        }
      }
      if (url === '/api/notifications') {
        return {
          data: notificationsData,
          pending: ref(false),
          error: ref(null),
          refresh: vi.fn(),
        }
      }
      throw new Error(`Unhandled useFetch url: ${url}`)
    })

    vi.stubGlobal('refreshNuxtData', refreshNuxtDataMock)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('opens the add data source modal when the FAB is clicked', async () => {
    const wrapper = mount(DashboardPage, {
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

  it('refreshes dashboard data when modal emits success', async () => {
    const wrapper = mount(DashboardPage, {
      global: {
        stubs: {
          AddDataSourceModal: AddDataSourceModalStub,
          NotificationList: NotificationListStub,
          DashboardStatCard: DashboardStatCardStub,
        },
      },
    })

    const modal = wrapper.findComponent(AddDataSourceModalStub)
    modal.vm.$emit('success')

    await Promise.resolve()

    expect(refreshNuxtDataMock).toHaveBeenCalledWith('dashboard-data-sources')
    expect(refreshNuxtDataMock).toHaveBeenCalledWith('dashboard-notifications')
  })
})
