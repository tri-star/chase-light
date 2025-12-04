<script setup lang="ts">
import { computed } from 'vue'
import z from 'zod'
import ActivityDetailPage from '~/components/pages/activities/detail/ActivityDetailPage.vue'

definePageMeta({
  middleware: 'auth',
})

const pageParamSchema = z.object({
  id: z.string(),
})
const route = useRoute()
const pageParams = pageParamSchema.parse(route.params)
const activityId = computed<string>(() => {
  return pageParams.id
})
</script>

<template>
  <ActivityDetailPage :activity-id="activityId" />
</template>
