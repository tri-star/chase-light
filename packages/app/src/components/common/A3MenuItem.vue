<script setup lang="ts">
import { tv } from 'tailwind-variants'
import type { A3MenuItemData } from './a3-menu-item'

defineProps<{
  menu: A3MenuItemData
  active?: boolean
}>()

const emit = defineEmits<{
  click: [value: string]
}>()

const classes = tv({
  base: 'hover:bg-menu-item-hover flex min-h-9 shrink-0 items-center gap-1 rounded p-2',
  variants: {
    active: {
      true: 'bg-menu-item-hover',
    },
  },
})
</script>

<template>
  <div :class="classes({ active })" @click="() => emit('click', menu.value)">
    <p class="text-default">{{ menu.label }}</p>
  </div>
</template>

<style scoped></style>
