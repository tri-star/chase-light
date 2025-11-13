<script setup lang="ts">
const sizeClasses = {
  md: 'h-12 w-12 p-3',
  lg: 'h-14 w-14 p-6',
} as const

type Size = keyof typeof sizeClasses

type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

interface Props {
  label?: string
  icon?: string
  size?: Size
  position?: Position
  offsetX?: number
  offsetY?: number
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  icon: 'i-heroicons-plus-20-solid',
  size: 'md',
  position: 'bottom-right',
  offsetX: undefined,
  offsetY: undefined,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

// 配置位置に応じたクラス
// offsetX/offsetYはpropsで指定可能だが、デフォルトはレスポンシブ（モバイル: 5, sm+: 10）
const positionClasses = computed(() => {
  const base = 'fixed z-fab'
  const offsetXClass = props.offsetX
    ? `right-[${props.offsetX}rem]`
    : 'right-5 sm:right-10'
  const offsetYClass = props.offsetY
    ? `bottom-[${props.offsetY}rem]`
    : 'bottom-5 sm:bottom-10'
  const leftXClass = props.offsetX
    ? `left-[${props.offsetX}rem]`
    : 'left-5 sm:left-10'
  const topYClass = props.offsetY
    ? `top-[${props.offsetY}rem]`
    : 'top-5 sm:top-10'

  switch (props.position) {
    case 'bottom-right':
      return `${base} ${offsetXClass} ${offsetYClass}`
    case 'bottom-left':
      return `${base} ${leftXClass} ${offsetYClass}`
    case 'top-right':
      return `${base} ${offsetXClass} ${topYClass}`
    case 'top-left':
      return `${base} ${leftXClass} ${topYClass}`
    default:
      return `${base} ${offsetXClass} ${offsetYClass}`
  }
})

const classes = computed(() => {
  return [
    positionClasses.value,
    'inline-flex justify-center items-center gap-2 rounded-full bg-surface-primary-default text-surface-primary-default border border-surface-primary-default shadow-lg shadow-black/20 transition',
    'hover:bg-surface-primary-hovered hover:text-surface-primary-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default',
    sizeClasses[props.size],
  ]
})

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<template>
  <button
    type="button"
    :aria-label="props.label"
    :class="classes"
    data-testid="fab-button"
    @click="handleClick"
  >
    <Icon v-if="icon" :name="icon" size="20" />
    <span v-if="label" class="hidden font-semibold sm:inline">
      {{ props.label }}
    </span>
  </button>
</template>
