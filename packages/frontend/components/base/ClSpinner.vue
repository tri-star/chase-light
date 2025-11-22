<script setup lang="ts">
const sizeClasses = {
  xs: 'h-4 w-4 border-2',
  sm: 'h-5 w-5 border-2',
  md: 'h-6 w-6 border-[3px]',
  lg: 'h-8 w-8 border-[3px]',
} as const

type SpinnerSize = keyof typeof sizeClasses
type SpinnerVariant = 'primary' | 'secondary' | 'muted'

interface Props {
  size?: SpinnerSize
  variant?: SpinnerVariant
  ariaLabel?: string
  srText?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'primary',
  ariaLabel: '読み込み中',
  srText: '読み込み中',
})

const variantClasses: Record<SpinnerVariant, string> = {
  primary:
    'border-surface-primary-default border-t-transparent text-surface-primary-default',
  secondary:
    'border-surface-secondary-default border-t-transparent text-surface-secondary-default',
  muted:
    'border-interactive-default border-t-transparent text-interactive-default',
}

const classes = computed(() => [
  'inline-flex',
  'animate-spin',
  'rounded-full',
  'border-solid',
  sizeClasses[props.size],
  variantClasses[props.variant],
])
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <span
      data-testid="cl-spinner"
      role="status"
      aria-live="polite"
      :aria-label="props.ariaLabel"
      :class="classes"
    />
    <span v-if="props.srText" class="sr-only">
      {{ props.srText }}
    </span>
  </span>
</template>
