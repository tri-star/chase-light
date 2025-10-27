<script setup lang="ts">
import type { NotificationListItemViewModel } from '~/features/notifications/models/notification'

interface Props {
  notifications?: NotificationListItemViewModel[]
  initialLoading?: boolean
  loadingMore?: boolean
  error?: string | null
  loadMoreError?: string | null
  hasNextPage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  notifications: () => [],
  initialLoading: false,
  loadingMore: false,
  error: null,
  loadMoreError: null,
  hasNextPage: false,
})

const emit = defineEmits<{
  (event: 'retry' | 'load-more'): void
}>()
</script>

<template>
  <div class="p-6 space-y-4">
    <div v-if="props.initialLoading" class="text-content-default opacity-75">
      通知を読み込んでいます...
    </div>

    <div v-else-if="props.error" class="space-y-2">
      <p class="text-status-alert-default">{{ props.error }}</p>
      <button
        type="button"
        class="text-sm text-surface-primary-default hover:text-surface-primary-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default rounded-md px-3 py-2"
        @click="emit('retry')"
      >
        再読み込み
      </button>
    </div>

    <div v-else>
      <div
        v-if="props.notifications.length === 0"
        class="text-content-default opacity-75"
      >
        未読通知はありません
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="notification in props.notifications"
          :key="notification.id"
          class="rounded-md border border-surface-secondary-default px-4 py-3 bg-surface-primary-default/40"
        >
          <p class="text-sm font-medium text-content-default">
            {{ notification.displayTimestampLabel || '未送信' }}
          </p>
          <p class="text-xs text-content-default opacity-75">
            {{
              notification.dataSources[0]?.name ??
              `通知 ${notification.id.slice(0, 8)}...`
            }}
          </p>
        </li>
      </ul>

      <div v-if="props.loadMoreError" class="text-status-alert-default text-sm">
        {{ props.loadMoreError }}
      </div>

      <button
        v-if="props.hasNextPage"
        type="button"
        class="text-sm text-surface-primary-default hover:text-surface-primary-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default rounded-md px-3 py-2"
        :disabled="props.loadingMore"
        @click="emit('load-more')"
      >
        {{ props.loadingMore ? '読み込み中...' : 'さらに読み込む' }}
      </button>
    </div>
  </div>
</template>
