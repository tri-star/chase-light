<script setup lang="ts">
import type { ActivityListItem as ActivityItem } from '~/features/activities/domain/activity-list'
import ActivityItemSkeleton from './ActivityItemSkeleton.vue'
import ActivityListItem from './ActivityListItem.vue'
import ClDivider from '~/components/base/ClDivider.vue'

interface Props {
  activities: ActivityItem[]
  isLoading: boolean
  isInitialLoading: boolean
  hasNextPage: boolean
  fetchError: string | null
  isEmpty: boolean
}

defineProps<Props>()

const skeletonPlaceholders = computed(() => Array.from({ length: 10 }))
</script>

<template>
  <div>
    <div v-if="isInitialLoading" class="space-y-6">
      <ActivityItemSkeleton
        v-for="(_, index) in skeletonPlaceholders"
        :key="`skeleton-${index}`"
      />
    </div>

    <div v-else-if="fetchError" class="py-10 text-center">
      <p class="text-sm text-card-value">
        アクティビティの取得に失敗しました。
      </p>
    </div>

    <div v-else-if="isEmpty" class="py-10 text-center">
      <p class="text-sm font-medium text-card-value">
        まだアクティビティがありません
      </p>
      <p class="text-xs mt-2 text-card-value opacity-70">
        ウォッチ中のリポジトリで更新があるとここに表示されます。
      </p>
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="(activityItem, index) in activities"
        :key="activityItem.activity.id"
      >
        <ActivityListItem :activity="activityItem" />
        <ClDivider v-if="index < activities.length - 1" spacing="sm" />
      </div>
    </div>

    <div
      v-if="isLoading && hasNextPage"
      class="text-sm text-center text-content-default opacity-60"
    >
      読み込み中...
    </div>
  </div>
</template>
