<script setup lang="ts">
import { computed, ref } from 'vue'
import NotificationList from './parts/NotificationList.vue'
import DashboardStatCard from './parts/DashboardStatCard.vue'
import AddDataSourceModal from './parts/AddDataSourceModal.vue'
import ClFabButton from '~/components/base/ClFabButton.vue'
import type {
  DataSourceListResponse,
  NotificationListResponse,
  NotificationListItem,
} from '~/generated/api/schemas'
import ClHeading from '~/components/base/ClHeading.vue'

// データソース統計の取得（SSRファースト）
const {
  data: dataSources,
  pending: _dataSourcesPending,
  error: _dataSourcesError,
} = await useFetch<DataSourceListResponse>('/api/data-sources', {
  key: 'dashboard-data-sources',
  params: {
    page: 1,
    perPage: 1,
  },
  default: () => ({
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
  }),
  server: true,
  lazy: false,
})

// 通知一覧の取得（SSRファースト）
const {
  data: notificationsResponse,
  pending,
  error,
  refresh: _refresh,
} = await useFetch<NotificationListResponse>('/api/notifications', {
  key: 'dashboard-notifications',
  params: {
    limit: 20,
  },
  default: () => ({
    success: true,
    data: {
      items: [],
      pageInfo: {
        hasNext: false,
        nextCursor: undefined,
      },
    },
  }),
  server: true,
  lazy: false,
})

// 無限スクロール用の状態管理
const notifications = ref<NotificationListItem[]>(
  notificationsResponse.value.success
    ? notificationsResponse.value.data.items
    : []
)
const hasNext = ref(
  notificationsResponse.value.success
    ? notificationsResponse.value.data.pageInfo.hasNext
    : false
)
const nextCursor = ref<string | null | undefined>(
  notificationsResponse.value.success
    ? notificationsResponse.value.data.pageInfo.nextCursor
    : undefined
)

// notificationsResponseの変更を監視
watch(notificationsResponse, (newValue) => {
  if (newValue.success) {
    notifications.value = newValue.data.items
    hasNext.value = newValue.data.pageInfo.hasNext
    nextCursor.value = newValue.data.pageInfo.nextCursor
  }
})

// 無限スクロールの実装
const loadMoreNotifications = async () => {
  if (!hasNext.value || !nextCursor.value) return

  try {
    const response = await $fetch<NotificationListResponse>(
      '/api/notifications',
      {
        params: {
          limit: 20,
          cursor: nextCursor.value,
        },
      }
    )

    if (response.success) {
      notifications.value.push(...response.data.items)
      hasNext.value = response.data.pageInfo.hasNext
      nextCursor.value = response.data.pageInfo.nextCursor
    }
  } catch (err) {
    console.error('Failed to load more notifications:', err)
  }
}

const { targetRef, isLoading } = useInfiniteScroll(loadMoreNotifications, {
  threshold: 200,
  enabled: computed(() => hasNext.value),
})

const totalWatchedRepositories = computed(() =>
  dataSources.value?.success ? dataSources.value.data.pagination.total : 0
)

const unreadNotificationsCount = computed(() => {
  return notifications.value.length
})

const statCards = computed(() => [
  {
    key: 'watched-repositories',
    label: 'ウォッチ中リポジトリ',
    value: totalWatchedRepositories.value,
    icon: 'i-heroicons-eye-20-solid',
    iconClass: 'text-status-info-default',
  },
  {
    key: 'unread-notifications',
    label: '未読通知',
    value: unreadNotificationsCount.value,
    icon: 'i-heroicons-bell-20-solid',
    iconClass: 'text-status-info-default',
  },
  {
    key: 'today-updates',
    label: '今日の更新',
    value: 0,
    icon: 'i-heroicons-check-circle-20-solid',
    iconClass: 'text-status-success-default',
  },
])

const isAddDataSourceModalOpen = ref(false)

const openAddDataSourceModal = () => {
  isAddDataSourceModalOpen.value = true
}

const handleAddDataSourceSuccess = async () => {
  isAddDataSourceModalOpen.value = false
  if (typeof refreshNuxtData === 'function') {
    await Promise.allSettled([
      refreshNuxtData('dashboard-data-sources'),
      refreshNuxtData('dashboard-notifications'),
    ])
  }
}
</script>

<template>
  <div ref="targetRef">
    <!-- ページタイトル -->
    <div class="mb-6">
      <ClHeading :level="1">ダッシュボード</ClHeading>
    </div>

    <!-- メインコンテンツ -->
    <div class="space-y-6">
      <!-- 統計情報 -->
      <dl
        v-if="dataSources?.success"
        class="grid grid-cols-1 justify-center gap-4 sm:grid-cols-2
          xl:grid-cols-3"
      >
        <DashboardStatCard
          v-for="card in statCards"
          :key="card.key"
          :name="card.key"
          :label="card.label"
          :value="card.value"
          :icon="card.icon"
          :icon-class="card.iconClass"
        />
      </dl>

      <!-- 通知一覧 -->
      <ClHeading :level="2">新着通知</ClHeading>
      <NotificationList
        :notifications="notifications"
        :loading="pending"
        :error="error?.message"
      />

      <!-- 無限スクロールローディング -->
      <div
        v-if="isLoading && hasNext"
        class="text-sm p-6 text-center text-content-default opacity-60"
      >
        読み込み中...
      </div>
    </div>
  </div>
  <ClFabButton
    data-testid="fab-button"
    icon="mdi:plus"
    @click="openAddDataSourceModal"
  />
  <AddDataSourceModal
    v-model:open="isAddDataSourceModalOpen"
    @success="handleAddDataSourceSuccess"
  />
</template>
