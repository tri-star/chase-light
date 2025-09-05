<script setup lang="ts">
import ClHeader from '../ClHeader.vue'

interface Props {
  brandText?: string
}

const props = withDefaults(defineProps<Props>(), {
  brandText: 'Chase Light',
})
</script>

<template>
  <div class="min-h-screen bg-content-default">
    <!-- Header -->
    <ClHeader :brand-text="props.brandText" />

    <!-- Main content area -->
    <main class="w-full">
      <div class="p-4 sm:p-6 lg:p-8">
        <slot />
      </div>
    </main>
  </div>
</template>
