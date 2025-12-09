<script setup lang="ts">
import { computed } from 'vue'
import type { DataSource, UserWatch } from '~/generated/api/schemas'
import { formatDate } from '~/utils/date'

const props = defineProps<{
  dataSource: DataSource
  userWatch?: UserWatch
}>()

const starsCount = computed(() => props.dataSource.repository?.starsCount ?? 0)
const language = computed(() => props.dataSource.repository?.language ?? '-')
const updatedAt = computed(() =>
  formatDate(props.dataSource.updatedAt, 'minutes')
)

const watchSettings = computed(() => {
  if (!props.userWatch) return []

  const settings = []
  if (props.userWatch.watchReleases) settings.push('リリース')
  if (props.userWatch.watchIssues) settings.push('Issue')
  if (props.userWatch.watchPullRequests) settings.push('PR')
  return settings
})
</script>

<template>
  <div class="space-y-4">
    <!-- Description -->
    <p v-if="dataSource.description" class="text-sm text-card-value">
      {{ dataSource.description }}
    </p>

    <!-- メタ情報 -->
    <div class="text-xs flex flex-wrap items-center gap-4 text-card-value">
      <!-- スター数 -->
      <div class="inline-flex items-center gap-1">
        <Icon
          name="heroicons:star-solid"
          class="text-yellow-500 h-4 w-4"
          aria-hidden="true"
        />
        <span>{{ starsCount.toLocaleString() }}</span>
      </div>

      <!-- 言語 -->
      <div class="inline-flex items-center gap-1">
        <Icon
          name="heroicons:code-bracket"
          class="h-4 w-4"
          aria-hidden="true"
        />
        <span>{{ language }}</span>
      </div>

      <!-- 最終更新日時 -->
      <div class="inline-flex items-center gap-1">
        <Icon name="heroicons:clock" class="h-4 w-4" aria-hidden="true" />
        <span>{{ updatedAt }}</span>
      </div>

      <!-- ウォッチ設定 -->
      <div
        v-if="watchSettings.length > 0"
        class="inline-flex items-center gap-1"
      >
        <Icon name="heroicons:bell" class="h-4 w-4" aria-hidden="true" />
        <span>{{ watchSettings.join(', ') }}</span>
      </div>
    </div>
  </div>
</template>
