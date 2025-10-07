<script setup lang="ts">
import { computed } from 'vue'
import RepositoryList from './parts/RepositoryList.vue'
import DashboardStatCard from './parts/DashboardStatCard.vue'
import type { DataSourceListResponse } from '~/generated/api/schemas'

// データ取得（SSRファースト）
const {
  data: dataSources,
  pending,
  error,
  refresh,
} = await useFetch<DataSourceListResponse>('/api/data-sources', {
  key: 'dashboard-data-sources',
  params: {
    page: 1,
    perPage: 20,
  },
  default: () => ({
    success: true,
    data: {
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
  }),
  server: true,
  lazy: false,
})

const totalWatchedRepositories = computed(() =>
  dataSources.value?.success ? dataSources.value.data.pagination.total : 0
)

const statCards = computed(() => [
  {
    key: 'watched-repositories',
    label: 'ウォッチ中リポジトリ',
    value: totalWatchedRepositories.value,
    icon: 'i-heroicons-eye-20-solid',
    iconClass: 'text-surface-primary-default',
  },
  {
    key: 'unread-notifications',
    label: '未読通知',
    value: 0,
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
</script>

<template>
  <!-- ページタイトル -->
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-content-default">ダッシュボード</h1>
    <p class="mt-2 text-content-default opacity-75">
      ウォッチ中のリポジトリの最新情報をチェックしましょう
    </p>
  </div>

  <!-- メインコンテンツ -->
  <div class="space-y-6">
    <!-- 統計情報 -->
    <div
      v-if="dataSources?.success"
      class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      <DashboardStatCard
        v-for="card in statCards"
        :key="card.key"
        :label="card.label"
        :value="card.value"
        :icon="card.icon"
        :icon-class="card.iconClass"
      />
    </div>

    <!-- リポジトリ一覧 -->
    <div
      class="bg-surface-secondary-default rounded-lg border border-surface-secondary-default"
    >
      <div class="px-6 py-4 border-b border-surface-secondary-default">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-content-default">
            ウォッチ中のリポジトリ
          </h2>
          <button
            type="button"
            class="text-sm text-surface-primary-default hover:text-surface-primary-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default rounded-md px-2 py-1"
            :disabled="pending"
            @click="refresh()"
          >
            {{ pending ? '更新中...' : '更新' }}
          </button>
        </div>
      </div>

      <RepositoryList
        :repositories="dataSources?.success ? dataSources.data.items : []"
        :loading="pending"
        :error="error?.message"
      />
    </div>
  </div>
</template>
