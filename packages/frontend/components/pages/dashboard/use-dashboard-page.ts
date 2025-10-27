import { computed, ref, watchEffect } from 'vue'
import type {
  DataSourceListResponse,
  NotificationListResponse,
} from '~/generated/api/schemas'
import {
  countNotificationsOccurredToday,
  mapNotificationItems,
  type NotificationListItemViewModel,
} from '~/features/notifications/models/notification'

const NOTIFICATION_LIMIT = 20
const NOTIFICATIONS_QUERY_KEY = 'dashboard:notifications'
const DATA_SOURCES_QUERY_KEY = 'dashboard:data-sources-count'

interface NotificationQueryState {
  items: NotificationListItemViewModel[]
  hasNext: boolean
  nextCursor: string | null
}

const createDefaultNotificationState = (): NotificationQueryState => ({
  items: [],
  hasNext: false,
  nextCursor: null,
})

const createDefaultNotificationResponse = (): NotificationListResponse => ({
  success: true,
  data: {
    items: [],
    pageInfo: {
      hasNext: false,
    },
  },
})

const createDefaultDataSourceResponse = (): DataSourceListResponse => ({
  success: true,
  data: {
    items: [],
    pagination: {
      page: 1,
      perPage: 1,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  },
})

const extractErrorMessage = (error: unknown): string | null => {
  if (!error) {
    return null
  }
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '不明なエラーが発生しました'
}

const fetchNotifications = async (cursor?: string) => {
  const params = {
    limit: NOTIFICATION_LIMIT,
    read: 'unread' as const,
    cursor,
  }

  return $fetch<NotificationListResponse>('/api/notifications', {
    params: cursor ? params : { limit: params.limit, read: params.read },
  })
}

const fetchWatchedDataSources = async () => {
  return $fetch<DataSourceListResponse>('/api/data-sources', {
    params: {
      perPage: 1,
    },
  })
}

export const useDashboardPage = async () => {
  const notificationsState = ref<NotificationQueryState>(
    createDefaultNotificationState()
  )
  const notificationsLoadError = ref<string | null>(null)
  const notificationsLoadMoreError = ref<string | null>(null)
  const isLoadingMore = ref(false)

  const watchedRepositoriesTotal = ref(0)

  const notificationsAsyncData = await useAsyncData(
    () => NOTIFICATIONS_QUERY_KEY,
    () => fetchNotifications(),
    {
      default: createDefaultNotificationResponse,
      server: true,
      lazy: false,
    }
  )

  const dataSourcesAsyncData = await useAsyncData(
    () => DATA_SOURCES_QUERY_KEY,
    () => fetchWatchedDataSources(),
    {
      default: createDefaultDataSourceResponse,
      server: true,
      lazy: false,
    }
  )

  watchEffect(() => {
    const response = notificationsAsyncData.data.value

    if (response?.success) {
      notificationsState.value = {
        items: mapNotificationItems(response.data.items),
        hasNext: response.data.pageInfo.hasNext,
        nextCursor: response.data.pageInfo.nextCursor ?? null,
      }
      notificationsLoadError.value = null
    } else if (notificationsAsyncData.error.value) {
      notificationsLoadError.value = extractErrorMessage(
        notificationsAsyncData.error.value
      )
      notificationsState.value = createDefaultNotificationState()
    }
  })

  watchEffect(() => {
    const response = dataSourcesAsyncData.data.value

    if (response?.success) {
      watchedRepositoriesTotal.value = response.data.pagination.total
    }
  })

  const isInitialLoading = computed(
    () =>
      notificationsAsyncData.pending.value &&
      notificationsState.value.items.length === 0 &&
      !notificationsLoadError.value
  )

  const loadMore = async () => {
    if (
      !notificationsState.value.hasNext ||
      !notificationsState.value.nextCursor ||
      isLoadingMore.value
    ) {
      return
    }

    isLoadingMore.value = true
    notificationsLoadMoreError.value = null

    try {
      const response = await fetchNotifications(
        notificationsState.value.nextCursor
      )

      if (!response.success) {
        throw new Error('通知の取得に失敗しました')
      }

      const mapped = mapNotificationItems(response.data.items)
      notificationsState.value = {
        items: [...notificationsState.value.items, ...mapped],
        hasNext: response.data.pageInfo.hasNext,
        nextCursor: response.data.pageInfo.nextCursor ?? null,
      }
    } catch (error) {
      notificationsLoadMoreError.value = extractErrorMessage(error)
    } finally {
      isLoadingMore.value = false
    }
  }

  const refresh = async () => {
    notificationsLoadMoreError.value = null
    await Promise.all([
      notificationsAsyncData.refresh(),
      dataSourcesAsyncData.refresh(),
    ])
  }

  const totalLoadedNotifications = computed(
    () => notificationsState.value.items.length
  )

  const todayNotifications = computed(() =>
    countNotificationsOccurredToday(notificationsState.value.items)
  )

  const statCards = computed(() => [
    {
      key: 'watched-repositories',
      label: 'ウォッチ中リポジトリ',
      value: watchedRepositoriesTotal.value,
      icon: 'i-heroicons-eye-20-solid',
      iconClass: 'text-status-info-default',
    },
    {
      key: 'unread-notifications',
      label: '未読通知',
      value: totalLoadedNotifications.value,
      icon: 'i-heroicons-bell-20-solid',
      iconClass: 'text-status-info-default',
    },
    {
      key: 'today-notifications',
      label: '本日の更新',
      value: todayNotifications.value,
      icon: 'i-heroicons-calendar-days-20-solid',
      iconClass: 'text-status-success-default',
    },
  ])

  return {
    statCards,
    notifications: computed(() => notificationsState.value.items),
    notificationsError: computed(() => notificationsLoadError.value),
    isInitialLoading,
    isLoadingMore: computed(() => isLoadingMore.value),
    hasNextPage: computed(() => notificationsState.value.hasNext),
    loadMoreError: computed(() => notificationsLoadMoreError.value),
    loadMore,
    refresh,
  }
}
