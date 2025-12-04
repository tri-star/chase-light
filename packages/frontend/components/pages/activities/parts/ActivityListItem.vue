<script setup lang="ts">
import { computed } from 'vue'
import ClHeading from '~/components/base/ClHeading.vue'
import type { ActivityListResponseDataItemsItem } from '~/generated/api/schemas'
import { formatDate, formatRelativeDate } from '~/utils/date'

const props = defineProps<{
  activity: ActivityListResponseDataItemsItem
}>()

const activityTypeLabels: Record<string, string> = {
  release: 'リリース',
  issue: 'Issue',
  pull_request: 'PR',
}

const activityTypeClasses: Record<string, string> = {
  release: 'bg-status-info-subtle text-status-info-default',
  issue: 'bg-status-warn-subtle text-status-warn-default',
  pull_request: 'bg-status-success-subtle text-status-success-default',
}

const activityData = computed(() => props.activity.activity)

const activityTitle = computed(() => {
  return activityData.value.translatedTitle || activityData.value.title
})

const activitySummary = computed(() => {
  return activityData.value.summary || '要約はまだ登録されていません'
})

const activityTypeLabel = computed(() => {
  const type = activityData.value.activityType
  return activityTypeLabels[type] || type
})

const activityBadgeClass = computed(() => {
  const type = activityData.value.activityType
  return (
    activityTypeClasses[type] || 'bg-surface-secondary-default text-card-value'
  )
})

const dataSourceName = computed(() => activityData.value.source.name)
const dataSourceUrl = computed(() => activityData.value.source.url)
const occurredAtMinutes = computed(() =>
  formatDate(activityData.value.occurredAt, 'minutes')
)
const occurredAtRelative = computed(() =>
  formatRelativeDate(activityData.value.occurredAt)
)
</script>

<template>
  <article data-testid="activity-item" class="space-y-4">
    <header
      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="text-xs tracking-wide text-card-value uppercase opacity-60">
        {{ occurredAtMinutes }}
      </div>
      <span
        class="text-xs rounded inline-flex items-center justify-center px-3 py-1
          font-medium"
        :class="activityBadgeClass"
      >
        {{ activityTypeLabel }}
      </span>
    </header>

    <div class="space-y-2">
      <a
        :href="dataSourceUrl"
        class="text-sm inline-flex items-center gap-2 font-medium
          text-card-value"
        target="_blank"
        rel="noreferrer noopener"
      >
        <Icon name="grommet-icons:github" class="h-5 w-5" aria-hidden="true" />
        <ClHeading :level="3" class="text-base">
          {{ dataSourceName }}
        </ClHeading>
        <span class="text-xs text-card-value opacity-60">{{
          occurredAtRelative
        }}</span>
      </a>

      <NuxtLink :to="{ path: `/activities/${activityData.id}` }">
        <ClHeading :level="2" class="text-xl text-card-value hover:underline">
          {{ activityTitle }}
        </ClHeading>
      </NuxtLink>
      <p class="text-sm text-card-value opacity-80">
        {{ activitySummary }}
      </p>
    </div>
  </article>
</template>
