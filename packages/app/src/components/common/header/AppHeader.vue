<script setup lang="ts">
import AppHeaderIcon from './AppHeaderIcon.vue'
</script>

<template>
  <header
    class="header bg-header sticky top-0 z-50 flex h-16 gap-4 p-2 shadow-md backdrop-blur-md"
  >
    <div class="flex flex-1"></div>
    <div class="flex"><AppHeaderIcon icon="mdi:account" /></div>
  </header>
</template>

<style scoped></style>
