<script setup lang="ts">
const sizeClasses = {
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-6 text-base',
} as const

type Size = keyof typeof sizeClasses

interface Props {
  label: string
  icon?: string
  size?: Size
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'i-heroicons-plus-20-solid',
  size: 'md',
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const classes = computed(() => {
  return [
    'inline-flex items-center gap-2 rounded-full bg-interactive-default text-white shadow-lg shadow-black/20 transition',
    'hover:bg-interactive-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default',
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
    <span :class="['text-xl', props.icon]" aria-hidden="true" />
    <span class="hidden font-semibold sm:inline">{{ props.label }}</span>
  </button>
</template>
