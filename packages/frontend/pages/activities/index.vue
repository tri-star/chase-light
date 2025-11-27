<template>
  <ActivityListPage />
</template>

<script setup lang="ts">
import ActivityListPage from '~/components/pages/activities/ActivityListPage.vue'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'アクティビティ一覧',
  ogTitle: 'アクティビティ一覧',
})
</script>
