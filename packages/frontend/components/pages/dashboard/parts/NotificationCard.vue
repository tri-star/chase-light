<script setup lang="ts">
import type { NotificationListItem } from '~/generated/api/schemas'

interface Props {
  item: NotificationListItem
}

const props = defineProps<Props>()

const activityTypeLabels: Record<string, string> = {
  release: 'リリース',
  issue: 'Issue',
  pull_request: 'PR',
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'たった今'
  if (diffMins < 60) return `${diffMins}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`

  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="bg-content-default py-6 px-6">
    <!-- 通知ヘッダー -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <!-- 通知アイコン -->
        <svg
          class="w-5 h-5 text-content-default opacity-60"
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
        <span class="text-xs text-content-default opacity-60">
          {{ formatDate(props.item.notification.lastActivityOccurredAt) }}
        </span>
      </div>
      <div
        v-if="!props.item.notification.isRead"
        class="w-2 h-2 bg-status-info-default rounded-full"
        aria-label="未読"
      ></div>
    </div>

    <!-- データソース別のアクティビティ -->
    <div
      v-for="dataSource in props.item.dataSources"
      :key="dataSource.id"
      class="mb-6 last:mb-0"
    >
      <!-- データソース名 -->
      <div class="mb-3">
        <a
          :href="dataSource.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm font-medium text-content-default hover:text-surface-primary-default transition-colors inline-flex items-center space-x-1"
        >
          <span>{{ dataSource.name }}</span>
          <svg
            class="w-3 h-3"
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
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      <!-- アクティビティグループ -->
      <div
        v-for="group in dataSource.groups"
        :key="group.activityType"
        class="mb-4 last:mb-0"
      >
        <!-- グループヘッダー -->
        <div class="mb-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
            :class="{
              'bg-status-info-subtle text-status-info-default':
                group.activityType === 'release',
              'bg-status-warn-subtle text-status-warn-default':
                group.activityType === 'issue',
              'bg-status-success-subtle text-status-success-default':
                group.activityType === 'pull_request',
            }"
          >
            {{ activityTypeLabels[group.activityType] || group.activityType }}
          </span>
        </div>

        <!-- アクティビティエントリ（最大5件） -->
        <div class="space-y-3">
          <div
            v-for="entry in group.entries.slice(0, 5)"
            :key="entry.activityId"
            class="pl-4 border-l-2 border-surface-secondary-default"
          >
            <div class="space-y-1">
              <!-- タイトル -->
              <h4 class="text-sm font-medium text-content-default">
                <a
                  v-if="entry.url"
                  :href="entry.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-surface-primary-default transition-colors"
                >
                  {{ entry.title }}
                </a>
                <span v-else>{{ entry.title }}</span>
              </h4>

              <!-- 要約 -->
              <p class="text-xs text-content-default opacity-75 line-clamp-2">
                {{ entry.summary }}
              </p>

              <!-- 発生日時 -->
              <div class="text-xs text-content-default opacity-60">
                {{ formatDate(entry.occurredAt) }}
              </div>
            </div>
          </div>

          <!-- 省略表示 -->
          <div
            v-if="group.entries.length > 5"
            class="pl-4 text-xs text-content-default opacity-60"
          >
            他 {{ group.entries.length - 5 }} 件
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
