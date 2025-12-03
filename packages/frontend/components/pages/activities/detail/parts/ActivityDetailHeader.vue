<script setup lang="ts">
import { computed } from 'vue'
import ClButton from '~/components/base/ClButton.vue'
import ClHeading from '~/components/base/ClHeading.vue'
import type { ActivityDetail } from '~/features/activities/domain/activity'
import { formatDate, formatRelativeDate } from '~/utils/date'

type ActivityType = NonNullable<ActivityDetail['activityType']>

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
  activity: ActivityDetail
  mode: 'translated' | 'original'
  hasTranslatedContent: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleMode'): void
}>()

const activityTypeLabel = computed(() => {
  const type = props.activity.activityType
  return activityTypeLabels[type] || type
})

const activityBadgeClass = computed(() => {
  const type = props.activity.activityType
  return (
    activityTypeClasses[type] || 'bg-surface-secondary-default text-card-value'
  )
})

const occurredAt = computed(() =>
  formatDate(props.activity.occurredAt, 'minutes')
)

const lastUpdated = computed(() =>
  formatDate(props.activity.lastUpdatedAt, 'minutes')
)

const lastUpdatedRelative = computed(() =>
  formatRelativeDate(props.activity.lastUpdatedAt)
)

const toggleLabel = computed(() =>
  props.mode === 'translated' ? '原文を表示' : '翻訳結果を表示'
)
</script>

<template>
  <header
    class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
  >
    <div class="space-y-3">
      <div class="text-sm flex items-center gap-3 text-card-value">
        <Icon
          name="grommet-icons:github"
          class="text-card-title h-5 w-5"
          aria-hidden="true"
        />
        <a
          :href="props.activity.source.url"
          class="text-card-title inline-flex items-center gap-2
            underline-offset-4 transition hover:underline"
          target="_blank"
          rel="noreferrer noopener"
        >
          <ClHeading :level="2" class="text-lg font-semibold">
            {{ props.activity.source.name }}
          </ClHeading>
          <span class="text-xs text-card-value opacity-70">外部リンク</span>
        </a>
      </div>

      <div class="text-xs flex flex-wrap items-center gap-3 text-card-value">
        <span
          class="rounded inline-flex items-center gap-1 px-3 py-1 font-semibold"
          :class="activityBadgeClass"
        >
          {{ activityTypeLabel }}
        </span>
        <div class="inline-flex items-center gap-2">
          <Icon
            name="i-heroicons-calendar-days-20-solid"
            class="h-4 w-4"
            aria-hidden="true"
          />
          <span>{{ occurredAt }}</span>
        </div>
        <div class="inline-flex items-center gap-2 text-card-value opacity-80">
          <Icon name="i-heroicons-clock-20-solid" class="h-4 w-4" />
          <span>最終更新 {{ lastUpdatedRelative }} / {{ lastUpdated }}</span>
        </div>
      </div>
    </div>

    <div
      class="flex items-center gap-3 self-start rounded-full
        bg-surface-secondary-default/60 px-4 py-2"
    >
      <div class="text-xs text-card-value">
        <span v-if="!props.hasTranslatedContent" class="opacity-70">
          翻訳が未登録のため原文を表示しています
        </span>
        <span v-else class="opacity-90">
          {{
            props.mode === 'translated' ? '翻訳結果を表示中' : '原文を表示中'
          }}
        </span>
      </div>
      <ClButton
        size="sm"
        intent="outline"
        data-testid="translation-toggle"
        :disabled="!props.hasTranslatedContent"
        @click="emit('toggleMode')"
      >
        {{ toggleLabel }}
      </ClButton>
    </div>
  </header>
</template>
