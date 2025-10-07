<script setup lang="ts">
import { computed, useSlots } from 'vue'

interface Props {
  icon?: string
  iconClass?: string
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  iconClass: 'text-surface-primary-default',
  disabled: false,
})

export type DashboardStatCardProps = Props

const slots = useSlots()

const cardClasses = computed(() => {
  const classes = [
    'flex items-start gap-4 rounded-lg border p-4 transition-colors',
    'bg-card-default border-card-default',
  ]

  if (props.disabled) {
    classes.push('cursor-not-allowed opacity-50')
  } else {
    classes.push('hover:bg-card-hovered hover:border-card-hovered')
  }

  return classes
})

const hasIcon = computed(() => Boolean(props.icon) || Boolean(slots.icon))
</script>

<template>
  <div :class="cardClasses" :aria-disabled="props.disabled || undefined">
    <div
      v-if="hasIcon"
      class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-card-hovered"
    >
      <slot name="icon">
        <Icon
          v-if="props.icon"
          :name="props.icon"
          class="h-6 w-6"
          :class="props.iconClass"
          aria-hidden="true"
        />
      </slot>
    </div>

    <div class="min-w-0 flex-1">
      <p class="text-sm text-card-label line-clamp-2" :title="props.label">
        {{ props.label }}
      </p>
      <div class="mt-2 flex items-baseline gap-2">
        <p class="text-2xl font-semibold text-card-value">
          {{ props.value }}
        </p>
        <slot name="suffix" />
      </div>
    </div>
  </div>
</template>
