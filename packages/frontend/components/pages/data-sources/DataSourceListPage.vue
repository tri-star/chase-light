<script setup lang="ts">
import ClHeading from '~/components/base/ClHeading.vue'
import DataSourceList from './parts/DataSourceList.vue'
</script>

<template>
  <div ref="targetRef" class="space-y-6">
    <div class="flex items-center justify-between">
      <ClHeading :level="1">データソース一覧</ClHeading>
    </div>

    <div class="flex justify-center">
      <DataSourceList />
    </div>
  </div>
</template>
