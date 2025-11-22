<script setup lang="ts">
import { tv } from 'tailwind-variants'
import ClSpinner from './ClSpinner.vue'

const buttonStyles = tv({
  base: [
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'rounded-md',
    'font-semibold',
    'transition-colors',
    'duration-150',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-status-focus-default',
    'disabled:cursor-not-allowed',
  ],
  variants: {
    intent: {
      default: [
        'bg-interactive-default',
        'text-interactive-default',
        'border',
        'border-interactive-default',
        'hover:bg-interactive-hovered',
        'hover:text-interactive-hovered',
        'active:bg-interactive-pressed',
        'active:text-interactive-pressed',
        'disabled:bg-interactive-disabled',
        'disabled:text-interactive-disabled',
        'disabled:border-interactive-disabled',
      ],
      primary: [
        'bg-surface-primary-default',
        'text-surface-primary-default',
        'border',
        'border-surface-primary-default',
        'hover:bg-surface-primary-hovered',
        'hover:text-surface-primary-hovered',
        'active:bg-surface-primary-pressed',
        'active:text-surface-primary-pressed',
        'disabled:bg-surface-primary-disabled',
        'disabled:text-surface-primary-disabled',
        'disabled:border-surface-primary-disabled',
      ],
      secondary: [
        'bg-surface-secondary-default',
        'text-surface-secondary-default',
        'border',
        'border-surface-secondary-default',
        'hover:bg-surface-secondary-hovered',
        'hover:text-surface-secondary-hovered',
        'active:bg-surface-secondary-pressed',
        'active:text-surface-secondary-pressed',
        'disabled:bg-surface-secondary-disabled',
        'disabled:text-surface-secondary-disabled',
        'disabled:border-surface-secondary-disabled',
      ],
      outline: [
        'bg-transparent',
        'text-interactive-default',
        'border',
        'border-interactive-default',
        'hover:bg-interactive-hovered',
        'hover:text-interactive-hovered',
        'active:bg-interactive-pressed',
        'active:text-interactive-pressed',
        'disabled:text-interactive-disabled',
        'disabled:border-interactive-disabled',
        'disabled:bg-transparent',
      ],
    },
    size: {
      sm: ['h-9', 'min-w-20', 'px-3', 'text-sm'],
      md: ['h-10', 'min-w-24', 'px-4', 'text-sm'],
      lg: ['h-12', 'min-w-28', 'px-5', 'text-base'],
    },
    block: {
      true: 'w-full',
    },
    loading: {
      true: 'pointer-events-none',
    },
  },
  defaultVariants: {
    intent: 'default',
    size: 'md',
  },
})

type ButtonIntent = 'default' | 'primary' | 'secondary' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  intent?: ButtonIntent
  size?: ButtonSize
  block?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  intent: 'default',
  size: 'md',
  block: false,
  loading: false,
  type: 'button',
  disabled: false,
  ariaLabel: undefined,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() =>
  buttonStyles({
    intent: props.intent,
    size: props.size,
    block: props.block,
    loading: props.loading,
  })
)

const handleClick = (event: MouseEvent) => {
  if (isDisabled.value) {
    event.preventDefault()
    return
  }

  emit('click', event)
}
</script>

<template>
  <button
    :type="props.type"
    data-testid="cl-button"
    :class="classes"
    :disabled="isDisabled"
    :aria-busy="props.loading ? 'true' : undefined"
    :aria-label="props.ariaLabel"
    @click="handleClick"
  >
    <slot name="prefix" />
    <ClSpinner
      v-if="props.loading"
      size="sm"
      variant="muted"
      aria-label="読み込み中"
      sr-text=""
    />
    <slot />
    <slot name="suffix" />
  </button>
</template>
