<script setup lang="ts">
import { computed } from 'vue'
import ActivityTypeBadge from '~/components/common/ActivityTypeBadge.vue'
import ClHeading from '~/components/base/ClHeading.vue'
import type { ActivityListResponseDataItemsItem } from '~/generated/api/schemas'
import { formatDate, formatRelativeDate } from '~/utils/date'

const props = defineProps<{
  activity: ActivityListResponseDataItemsItem
}>()

const activityData = computed(() => props.activity.activity)

const activityTitle = computed(() => {
  return activityData.value.translatedTitle || activityData.value.title
})

const activitySummary = computed(() => {
  return activityData.value.summary || '要約はまだ登録されていません'
})

const dataSourceName = computed(() => activityData.value.source.name)
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
      <ActivityTypeBadge :activity-type="activityData.activityType" />
    </header>

    <div class="space-y-2">
      <NuxtLink
        :to="`/data-sources/${activityData.source.id}`"
        class="text-sm inline-flex items-center gap-2 font-medium
          text-card-value"
      >
        <Icon name="grommet-icons:github" class="h-5 w-5" aria-hidden="true" />
        <ClHeading :level="3" class="text-base">
          {{ dataSourceName }}
        </ClHeading>
        <span class="text-xs text-card-value opacity-60">{{
          occurredAtRelative
        }}</span>
      </NuxtLink>

      <ClHeading :level="2" class="text-xl text-card-value"
        ><NuxtLink :to="{ path: `/activities/${activityData.id}` }">{{
          activityTitle
        }}</NuxtLink></ClHeading
      >
      <p class="text-sm text-card-value opacity-80">
        {{ activitySummary }}
      </p>
    </div>
  </article>
</template>
