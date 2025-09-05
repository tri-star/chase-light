<template>
  <DashboardPage />
</template>

<script setup lang="ts">
import DashboardPage from '~/components/pages/dashboard/DashboardPage.vue'

definePageMeta({
  middleware: 'auth',
})
</script>
