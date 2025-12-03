<template>
  <DataSourceListPage />
</template>

<script setup lang="ts">
import DataSourceListPage from '~/components/pages/data-sources/DataSourceListPage.vue'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'データソース一覧',
  ogTitle: 'データソース一覧',
})
</script>
