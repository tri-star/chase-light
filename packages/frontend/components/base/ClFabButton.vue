<script setup lang="ts">
const sizeClasses = {
  md: 'h-12 w-12 p-3',
  lg: 'h-14 w-14 p-6',
} as const

type Size = keyof typeof sizeClasses

type AlignX = 'left' | 'right'
type AlignY = 'top' | 'bottom'
type Offset = 'sm' | 'md' | 'lg'

interface Props {
  label?: string
  icon?: string
  size?: Size
  alignX?: AlignX
  alignY?: AlignY
  offsetX?: Offset
  offsetY?: Offset
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  icon: 'i-heroicons-plus-20-solid',
  size: 'md',
  alignX: 'right',
  alignY: 'bottom',
  offsetX: undefined,
  offsetY: undefined,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

// offsetをTailwindクラスにマッピング
const offsetMap: Record<Offset, number> = {
  sm: 4,
  md: 6,
  lg: 10,
}

// 配置位置に応じたクラス
const positionClasses = computed(() => {
  const base = 'fixed z-fab'

  // 横方向の配置
  const horizontalClass = props.offsetX
    ? props.alignX === 'left'
      ? `left-${offsetMap[props.offsetX]}`
      : `right-${offsetMap[props.offsetX]}`
    : props.alignX === 'left'
      ? 'left-5 sm:left-10'
      : 'right-5 sm:right-10'

  // 縦方向の配置
  const verticalClass = props.offsetY
    ? props.alignY === 'top'
      ? `top-${offsetMap[props.offsetY]}`
      : `bottom-${offsetMap[props.offsetY]}`
    : props.alignY === 'top'
      ? 'top-5 sm:top-10'
      : 'bottom-5 sm:bottom-10'

  return `${base} ${horizontalClass} ${verticalClass}`
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
