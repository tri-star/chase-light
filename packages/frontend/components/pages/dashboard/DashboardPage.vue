<script setup lang="ts">
import DashboardStatCard from './parts/DashboardStatCard.vue'
import NotificationList from './parts/NotificationList.vue'
import { useDashboardPage } from './use-dashboard-page'

const {
  statCards,
  notifications,
  notificationsError,
  isInitialLoading,
  isLoadingMore,
  hasNextPage,
  loadMoreError,
  loadMore,
  refresh,
} = await useDashboardPage()
</script>

<template>
  <!-- ページタイトル -->
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-content-default">ダッシュボード</h1>
    <p class="mt-2 text-content-default opacity-75">
      未読の通知ダイジェストをまとめて確認できます
    </p>
  </div>

  <!-- メインコンテンツ -->
  <div class="space-y-6">
    <!-- 統計情報 -->
    <dl
      class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 justify-center"
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
    <div
      class="bg-surface-secondary-default rounded-lg border border-surface-secondary-default"
    >
      <div class="px-6 py-4 border-b border-surface-secondary-default">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-content-default">通知一覧</h2>
          <button
            type="button"
            class="text-sm text-surface-primary-default hover:text-surface-primary-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default rounded-md px-2 py-1"
            :disabled="isInitialLoading"
            @click="refresh()"
          >
            {{ isInitialLoading ? '更新中...' : '更新' }}
          </button>
        </div>
      </div>

      <NotificationList
        :notifications="notifications"
        :initial-loading="isInitialLoading"
        :loading-more="isLoadingMore"
        :error="notificationsError"
        :load-more-error="loadMoreError"
        :has-next-page="hasNextPage"
        @retry="refresh"
        @load-more="loadMore"
      />
    </div>
  </div>
</template>
