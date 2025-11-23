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
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'primary',
  ariaLabel: '読み込み中',
})

const variantClasses: Record<SpinnerVariant, string> = {
  primary: 'border-surface-primary-default border-t-transparent',
  secondary: 'border-surface-secondary-default border-t-transparent',
  muted: 'border-interactive-default border-t-transparent',
}

const classes = computed(() => [
  'inline-block',
  'animate-spin',
  'rounded-full',
  'border-solid',
  sizeClasses[props.size],
  variantClasses[props.variant],
])
</script>

<template>
  <span
    data-testid="cl-spinner"
    role="status"
    :aria-label="props.ariaLabel"
    :class="classes"
  />
</template>
