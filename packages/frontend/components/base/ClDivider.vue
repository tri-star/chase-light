<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{
    /** 罫線のスタイル */
    variant?: 'solid' | 'dashed'
    /** 縦方向の余白プリセット */
    spacing?: 'none' | 'sm' | 'md' | 'lg'
  }>(),
  {
    variant: 'dashed',
    spacing: 'md',
  }
)

const variantClass = computed(() =>
  props.variant === 'solid'
    ? 'border-solid border-surface-secondary-default'
    : 'border-dashed border-surface-secondary-default'
)

const spacingClass = computed(() => {
  switch (props.spacing) {
    case 'none':
      return 'my-0'
    case 'sm':
      return 'my-4'
    case 'lg':
      return 'my-12'
    default:
      return 'my-8'
  }
})
</script>

<template>
  <hr
    :class="[
      'border-0 border-t px-4 opacity-80 transition-colors duration-300',
      variantClass,
      spacingClass,
    ]"
    aria-hidden="true"
  />
</template>
