<script setup lang="ts">
import { computed } from 'vue'

type ActivityType = 'release' | 'issue' | 'pull_request'

interface Props {
  activityType: ActivityType
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

// アクティビティ種別のラベル定義
const activityTypeLabels: Record<ActivityType, string> = {
  release: 'Release',
  issue: 'Issue',
  pull_request: 'PR',
}

// アクティビティ種別のスタイル定義
const activityTypeClasses: Record<ActivityType, string> = {
  release: 'bg-status-info-subtle text-status-info-default',
  issue: 'bg-status-warn-subtle text-status-warn-default',
  pull_request: 'bg-status-success-subtle text-status-success-default',
}

const label = computed(() => activityTypeLabels[props.activityType])

const badgeClasses = computed(() => {
  const sizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
  }

  return [
    'text-xs',
    'rounded',
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    sizeClasses[props.size],
    activityTypeClasses[props.activityType],
  ]
})
</script>

<template>
  <span :class="badgeClasses">
    {{ label }}
  </span>
</template>
