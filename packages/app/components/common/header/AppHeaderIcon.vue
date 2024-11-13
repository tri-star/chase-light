<script setup lang="ts">
import { tv } from 'tailwind-variants'

defineProps<{
  icon: string
}>()

const menuClasses = tv({
  base: [
    'flex',
    'w-12',
    'p-1',
    'justify-center',
    'items-center',
    'rounded-full',
    'bg-header-icon',
    'hover:bg-header-icon-hover',
    'transition-all',
    'duration-500',
    'cursor-pointer',
    'group',
  ],
})

const iconClasses = tv({
  base: [
    'text-header-icon',
    'group-hover:text-header-icon-hover',
    'transition-all',
    'duration-500',
  ],
})
</script>

<template>
  <div :class="menuClasses()">
    <Icon :name="icon" mode="svg" size="32" :class="iconClasses()" />
  </div>
</template>

<style scoped></style>
