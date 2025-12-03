<script setup lang="ts">
import { computed } from 'vue'
import { tv } from 'tailwind-variants'

const iconButtonStyles = tv({
  base: [
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-full',
    'transition-colors',
    'duration-150',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-status-focus-default',
    'border',
    'disabled:cursor-not-allowed',
  ],
  variants: {
    variant: {
      ghost: [
        'bg-transparent',
        'text-card-value',
        'border-transparent',
        'hover:bg-surface-secondary-default',
        'hover:text-card-title',
        'active:bg-surface-secondary-hovered',
        'active:text-card-title',
        'disabled:text-interactive-disabled',
        'disabled:hover:bg-transparent',
      ],
      solid: [
        'bg-interactive-default',
        'text-interactive-default',
        'border-interactive-default',
        'hover:bg-interactive-hovered',
        'hover:text-interactive-hovered',
        'active:bg-interactive-pressed',
        'active:text-interactive-pressed',
        'disabled:bg-interactive-disabled',
        'disabled:text-interactive-disabled',
        'disabled:border-interactive-disabled',
      ],
    },
    size: {
      sm: ['h-9', 'w-9', 'text-base'],
      md: ['h-10', 'w-10', 'text-lg'],
      lg: ['h-12', 'w-12', 'text-xl'],
    },
    disabled: {
      true: 'pointer-events-none opacity-80',
    },
  },
  defaultVariants: {
    variant: 'ghost',
    size: 'md',
  },
})

type IconButtonVariant = 'ghost' | 'solid'
type IconButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  ariaLabel: string
  icon?: string
  variant?: IconButtonVariant
  size?: IconButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  variant: 'ghost',
  size: 'md',
  type: 'button',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const classes = computed(() =>
  iconButtonStyles({
    variant: props.variant,
    size: props.size,
    disabled: props.disabled,
  })
)

const handleClick = (event: MouseEvent) => {
  if (props.disabled) {
    event.preventDefault()
    return
  }

  emit('click', event)
}
</script>

<template>
  <button
    :type="props.type"
    data-testid="cl-icon-button"
    :class="classes"
    :aria-label="props.ariaLabel"
    :disabled="props.disabled"
    @click="handleClick"
  >
    <Icon v-if="props.icon" :name="props.icon" aria-hidden="true" />
    <slot />
  </button>
</template>
