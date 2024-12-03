<script setup lang="ts">
import type { A3MenuItemData } from "./a3-menu-item"

defineProps<{
  menu: A3MenuItemData
}>()

const emit = defineEmits<{
  click: [value: string]
}>()
</script>

<template>
  <div
    class="hover:bg-menu-item-hover flex min-h-9 shrink-0 items-center gap-1 rounded p-2"
    @click="() => emit('click', menu.value)"
  >
    <p class="text-default">{{ menu.label }}</p>
  </div>
</template>

<style scoped></style>
