<script setup lang="ts">
import { computed } from 'vue'
import type { DataSourceListItem } from '~/features/data-sources/domain/data-source'

const props = defineProps<{
  item: DataSourceListItem
}>()

const dataSource = computed(() => props.item.dataSource)
const userWatch = computed(() => props.item.userWatch)
const repository = computed(() => dataSource.value.repository)

const starsCount = computed(() => {
  const count = repository.value.starsCount
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
})

const language = computed(() => repository.value.language || 'N/A')

// ウォッチ状態のバッジ
const watchBadges = computed(() => {
  const badges: { label: string; active: boolean }[] = [
    { label: 'Release', active: userWatch.value.watchReleases },
    { label: 'PR', active: userWatch.value.watchPullRequests },
    { label: 'Issue', active: userWatch.value.watchIssues },
  ]
  return badges
})
</script>

<template>
  <article data-testid="data-source-item" class="space-y-3">
    <header
      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2">
        <Icon
          name="grommet-icons:github"
          class="h-5 w-5 text-card-value"
          aria-hidden="true"
        />
        <NuxtLink
          :to="`/data-sources/${dataSource.id}`"
          class="text-lg font-semibold text-card-value hover:underline"
        >
          {{ repository.fullName }}
        </NuxtLink>
        <span
          v-if="dataSource.isPrivate"
          class="text-xs rounded bg-surface-secondary-default px-2 py-0.5
            text-card-value"
        >
          Private
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="badge in watchBadges"
          :key="badge.label"
          :class="[
            'text-xs rounded inline-flex items-center px-2 py-1 font-medium',
            badge.active
              ? 'bg-status-success-subtle text-status-success-default'
              : 'bg-surface-secondary-default text-card-value opacity-50',
          ]"
        >
          <Icon
            v-if="badge.active"
            name="heroicons:check-circle-20-solid"
            class="mr-1 h-3 w-3"
            aria-hidden="true"
          />
          <Icon
            v-else
            name="heroicons:minus-circle-20-solid"
            class="mr-1 h-3 w-3"
            aria-hidden="true"
          />
          {{ badge.label }}
        </span>
      </div>
    </header>

    <p v-if="dataSource.description" class="text-sm text-card-value opacity-80">
      {{ dataSource.description }}
    </p>

    <div class="flex flex-wrap items-center gap-4 text-card-value">
      <span class="text-sm flex items-center gap-1">
        <Icon
          name="heroicons:star-20-solid"
          class="text-yellow-500 h-4 w-4"
          aria-hidden="true"
        />
        {{ starsCount }}
      </span>
      <span v-if="language !== 'N/A'" class="text-sm flex items-center gap-1">
        <Icon
          name="heroicons:code-bracket-20-solid"
          class="h-4 w-4"
          aria-hidden="true"
        />
        {{ language }}
      </span>
    </div>
  </article>
</template>
