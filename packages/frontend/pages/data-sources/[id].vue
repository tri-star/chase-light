<script setup lang="ts">
import DataSourceDetailPage from '~/components/pages/data-sources/detail/DataSourceDetailPage.vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const dataSourceId = computed(() => route.params.id as string)
</script>

<template>
  <DataSourceDetailPage :data-source-id="dataSourceId" />
</template>
