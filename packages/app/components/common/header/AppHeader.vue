<script setup lang="ts">
import AppHeaderIcon from "./AppHeaderIcon.vue"
</script>

<template>
  <header
    class="header flex bg-header h-16 p-2 gap-4 backdrop-blur-md sticky top-0 z-50 shadow-md"
  >
    <div class="flex flex-1"></div>
    <div class="flex"><AppHeaderIcon icon="mdi:account" /></div>
  </header>
</template>

<style scoped></style>
