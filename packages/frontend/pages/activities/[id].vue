<script setup lang="ts">
import { computed } from 'vue'
import ActivityDetailPage from '~/components/pages/activities/detail/ActivityDetailPage.vue'
import type { ActivityDetailResponse } from '~/generated/api/schemas'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const activityId = computed<string>(() => {
  const idParam = route.params.id
  return Array.isArray(idParam) ? idParam[0] : idParam
})

const endpoint = computed(() => `/api/activities/${activityId.value}`)

const fetchActivityDetail = () =>
  $fetch<ActivityDetailResponse>(endpoint.value)

const { data, error } = await useAsyncData<ActivityDetailResponse>(
  'activity-detail',
  fetchActivityDetail,
  {
    server: true,
    lazy: false,
    watch: [activityId],
  }
)

if (error.value) {
  throw error.value
}

const activity = computed(() => data.value?.data.activity)

const pageTitle = computed(
  () =>
    activity.value?.translatedTitle ||
    activity.value?.title ||
    'アクティビティ詳細'
)

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
})
</script>

<template>
  <ActivityDetailPage v-if="activity" :activity="activity" />
</template>
