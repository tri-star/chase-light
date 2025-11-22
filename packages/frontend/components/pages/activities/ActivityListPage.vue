<script setup lang="ts">
import ClHeading from '~/components/base/ClHeading.vue'
import ActivityList from './parts/ActivityList.vue'
</script>

<template>
  <div ref="targetRef" class="space-y-6">
    <div class="flex items-center justify-between">
      <ClHeading :level="1">アクティビティ一覧</ClHeading>
    </div>

    <div class="flex justify-center">
      <ActivityList />
    </div>
  </div>
</template>
