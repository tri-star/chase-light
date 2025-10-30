<script setup lang="ts">
import type { NotificationListItem } from '~/generated/api/schemas'
import NotificationCard from './NotificationCard.vue'
import ClSection from '~/components/base/ClSection.vue'

interface Props {
  notifications?: NotificationListItem[]
  loading?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  notifications: () => [],
  loading: false,
  error: undefined,
})
</script>

<template>
  <div>
    <!-- ローディング状態 -->
    <div v-if="props.loading" class="p-6">
      <div class="animate-pulse space-y-6">
        <div v-for="i in 3" :key="i" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="h-4 bg-surface-secondary-default rounded w-24"></div>
            <div
              class="w-2 h-2 bg-surface-secondary-default rounded-full"
            ></div>
          </div>
          <div class="space-y-2">
            <div class="h-4 bg-surface-secondary-default rounded w-3/4"></div>
            <div class="h-3 bg-surface-secondary-default rounded w-1/2"></div>
            <div class="h-3 bg-surface-secondary-default rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- エラー状態 -->
    <div v-else-if="props.error" class="p-6">
      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 text-status-alert-default"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-card-value">
          通知の読み込みに失敗しました
        </h3>
        <p class="mt-1 text-sm text-card-value opacity-75">
          {{ props.error }}
        </p>
      </div>
    </div>

    <!-- 空の状態 -->
    <div v-else-if="props.notifications.length === 0" class="p-6">
      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 text-card-value opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-card-value">
          新しい通知はありません
        </h3>
        <p class="mt-1 text-sm text-card-value opacity-75">
          ウォッチ中のリポジトリで新しいアクティビティがあると、ここに通知が表示されます。
        </p>
      </div>
    </div>

    <!-- 通知一覧 -->
    <div v-else class="flex flex-col gap-6">
      <ClSection
        v-for="item in props.notifications"
        :key="item.notification.id"
      >
        <NotificationCard :item="item" />
      </ClSection>
    </div>
  </div>
</template>
