<script setup lang="ts">
const { level = 1 } = defineProps<{
  level?: 1 | 2 | 3
}>()

const fontVarNameMap = {
  1: '--typography-scale-4xl',
  2: '--typography-scale-2xl',
  3: '--typography-scale-xl',
}
</script>

<template>
  <component
    :is="`h${level ?? 1}`"
    :style="{ font: `var(${fontVarNameMap[level]})` }"
    class="text-content-default"
  >
    <slot />
  </component>
</template>

<style scoped></style>
