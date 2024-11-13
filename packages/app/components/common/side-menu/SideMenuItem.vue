<script setup lang="ts">
import { tv } from 'tailwind-variants'
import type { RouteLocationAsPathGeneric } from 'vue-router'

defineProps<{
  icon: string
  title: string
  to: RouteLocationAsPathGeneric
  isActive: boolean
}>()

const menuClasses = tv({
  base: [
    'bg-side-menu',
    'w-full',
    'items-center',
    'rounded-md',
    'flex',
    'py-2',
    'px-4',
    'gap-4',
    'group',
  ],
  variants: {
    active: {
      true: ['bg-side-menu-active'],
      false: ['hover:bg-side-menu-hover', 'transition-all', 'duration-300'],
    },
  },
})

const menuTextClasses = tv({
  base: ['text-side-menu-text', 'text-size-l', 'font-bold'],
  variants: {
    active: {
      true: ['text-side-menu-text-active'],
      false: ['text-side-menu-text', 'group-hover:text-side-menu-text-hover'],
    },
  },
})
</script>

<template>
  <NuxtLink :to="to" :class="menuClasses({ active: isActive })">
    <Icon
      :name="icon"
      mode="svg"
      size="40"
      :class="menuTextClasses({ active: isActive })"
    />
    <p :class="menuTextClasses({ active: isActive })">{{ title }}</p>
  </NuxtLink>
</template>
