<script setup lang="ts">
import { computed } from 'vue'
import ClDivider from '~/components/base/ClDivider.vue'
import ClHeading from '~/components/base/ClHeading.vue'
import type {
  DataSourceActivityItem,
  DataSourceActivityPagination,
} from '~/features/data-sources/domain/data-source-detail'
import { formatDate } from '~/utils/date'

type ActivityType = 'release' | 'issue' | 'pull_request'

const activityTypeLabels: Record<ActivityType, string> = {
  release: 'リリース',
  issue: 'Issue',
  pull_request: 'PR',
}

const activityTypeClasses: Record<ActivityType, string> = {
  release: 'bg-status-info-subtle text-status-info-default',
  issue: 'bg-status-warn-subtle text-status-warn-default',
  pull_request: 'bg-status-success-subtle text-status-success-default',
}

const props = defineProps<{
  activities: DataSourceActivityItem[]
  pagination?: DataSourceActivityPagination
  loading: boolean
}>()

const hasActivities = computed(() => props.activities.length > 0)

const getActivityTypeLabel = (type: string) => {
  return activityTypeLabels[type as ActivityType] || type
}

const getActivityBadgeClass = (type: string) => {
  return (
    activityTypeClasses[type as ActivityType] ||
    'bg-surface-secondary-default text-card-value'
  )
}

const formatActivityDate = (date: string) => {
  return formatDate(date, 'minutes')
}
</script>

<template>
  <section class="space-y-4">
    <ClHeading :level="2" class="text-lg text-card-title font-semibold">
      アクティビティ
    </ClHeading>

    <!-- ローディング -->
    <div v-if="loading" class="py-8 text-center text-card-value">
      読み込み中...
    </div>

    <!-- アクティビティがない場合 -->
    <div
      v-else-if="!hasActivities"
      class="border-border-default rounded-lg border
        bg-surface-secondary-default p-6 text-center"
    >
      <Icon
        name="heroicons:inbox"
        class="mx-auto h-12 w-12 text-card-value opacity-50"
        aria-hidden="true"
      />
      <p class="text-sm mt-2 text-card-value">
        このデータソースにはまだアクティビティがありません
      </p>
    </div>

    <!-- アクティビティ一覧 -->
    <ul v-else class="space-y-0">
      <li v-for="(item, index) in activities" :key="item.activity.id">
        <ClDivider v-if="index > 0" spacing="sm" />
        <div class="space-y-2 py-2">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2">
              <span
                class="rounded text-xs px-2 py-0.5 font-semibold"
                :class="getActivityBadgeClass(item.activity.activityType)"
              >
                {{ getActivityTypeLabel(item.activity.activityType) }}
              </span>
              <span
                v-if="item.activity.version"
                class="text-xs text-card-value"
              >
                {{ item.activity.version }}
              </span>
            </div>
            <span class="text-xs shrink-0 text-card-value">
              {{ formatActivityDate(item.activity.occurredAt) }}
            </span>
          </div>
          <h3 class="text-card-title font-medium">
            <NuxtLink
              :to="`/activities/${item.activity.id}`"
              class="hover:text-link-default transition-colors hover:underline"
            >
              {{
                item.activity.translatedTitle ||
                item.activity.title ||
                '(タイトルなし)'
              }}
            </NuxtLink>
          </h3>
          <p
            v-if="item.activity.summary"
            class="text-sm line-clamp-2 text-card-value"
          >
            {{ item.activity.summary }}
          </p>
        </div>
      </li>
    </ul>

    <!-- ページネーション情報 -->
    <div
      v-if="pagination && pagination.total > 0"
      class="text-xs text-center text-card-value"
    >
      {{ pagination.total }}件中
      {{ Math.min(pagination.perPage, pagination.total) }}件を表示
    </div>
  </section>
</template>
