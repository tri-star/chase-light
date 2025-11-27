<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import ClSection from '~/components/base/ClSection.vue'
import ActivityDetailHeader from './parts/ActivityDetailHeader.vue'
import ActivityDetailContent from './parts/ActivityDetailContent.vue'
import type { ActivityDetailResponse } from '~/generated/api/schemas'

const props = defineProps<{
  activityId: string
}>()

type DisplayMode = 'translated' | 'original'

const mode = ref<DisplayMode>('translated')

const { data, error } = await useFetch<ActivityDetailResponse>(
  `/api/activities/${props.activityId}`
)

if (error.value) {
  throw error.value
}

const activity = data.value?.data.activity

const pageTitle = computed(
  () => activity?.translatedTitle || activity?.title || 'アクティビティ詳細'
)

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
})

const hasTranslatedContent = computed(
  () => !!(activity?.translatedTitle || activity?.translatedBody)
)

watchEffect(() => {
  if (!hasTranslatedContent.value) {
    mode.value = 'original'
  }
})

const displayTitle = computed(() => {
  if (mode.value === 'translated' && hasTranslatedContent.value) {
    return (activity?.translatedTitle || activity?.title) ?? ''
  }
  return activity?.title ?? ''
})

const displayBody = computed(() => {
  if (mode.value === 'translated' && hasTranslatedContent.value) {
    return (activity?.translatedBody || activity?.detail) ?? ''
  }
  return activity?.detail ?? ''
})

const handleToggleMode = () => {
  if (!hasTranslatedContent.value) return
  mode.value = mode.value === 'translated' ? 'original' : 'translated'
}
</script>

<template>
  <ClSection class="space-y-6" data-testid="activity-detail-page">
    <template v-if="activity">
      <ActivityDetailHeader
        :activity="activity"
        :mode="mode"
        :has-translated-content="hasTranslatedContent"
        @toggle-mode="handleToggleMode"
      />
      <ActivityDetailContent
        :title="displayTitle"
        :body="displayBody"
        :mode="mode"
        :has-translated-content="hasTranslatedContent"
      />
    </template>
  </ClSection>
</template>
