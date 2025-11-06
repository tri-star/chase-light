<script setup lang="ts">
const sizeClasses = {
  md: 'h-12 w-12 p-3',
  lg: 'h-14 w-14 p-6',
} as const

type Size = keyof typeof sizeClasses

interface Props {
  label?: string
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
    'inline-flex justify-center items-center gap-2 rounded-full bg-surface-primary-default text-surface-primary-default border-surface-primary-default shadow-lg shadow-black/20 transition',
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
    <Icon :name="icon" v-if="icon" size="20" />
    <span class="hidden font-semibold sm:inline" v-if="label">{{
      props.label
    }}</span>
  </button>
</template>
