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

// 横方向のoffsetクラスマッピング（静的なクラス名を返す）
const getHorizontalOffsetClass = (alignX: AlignX, offset: Offset): string => {
  const classMap: Record<AlignX, Record<Offset, string>> = {
    left: {
      sm: 'left-4',
      md: 'left-6',
      lg: 'left-10',
    },
    right: {
      sm: 'right-4',
      md: 'right-6',
      lg: 'right-10',
    },
  }
  return classMap[alignX][offset]
}

// 縦方向のoffsetクラスマッピング（静的なクラス名を返す）
const getVerticalOffsetClass = (alignY: AlignY, offset: Offset): string => {
  const classMap: Record<AlignY, Record<Offset, string>> = {
    top: {
      sm: 'top-4',
      md: 'top-6',
      lg: 'top-10',
    },
    bottom: {
      sm: 'bottom-4',
      md: 'bottom-6',
      lg: 'bottom-10',
    },
  }
  return classMap[alignY][offset]
}

// 配置位置に応じたクラス
const positionClasses = computed(() => {
  const base = 'fixed z-fab'

  // 横方向の配置（デフォルトは'md'）
  const horizontalClass = getHorizontalOffsetClass(
    props.alignX,
    props.offsetX || 'md'
  )

  // 縦方向の配置（デフォルトは'md'）
  const verticalClass = getVerticalOffsetClass(
    props.alignY,
    props.offsetY || 'md'
  )

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
