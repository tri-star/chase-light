<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import ClSection from '~/components/base/ClSection.vue'
import ActivityDetailHeader from './parts/ActivityDetailHeader.vue'
import ActivityDetailContent from './parts/ActivityDetailContent.vue'
import { ActivityDetailRepository } from '~/features/activities/repositories/activity-detail-repository'
import type { ActivityDetail } from '~/features/activities/domain/activity'

const props = defineProps<{
  activityId: string
}>()

type DisplayMode = 'translated' | 'original'

const mode = ref<DisplayMode>('translated')
const activityDetailRepository = new ActivityDetailRepository()

const fetchKey = computed(() => `activity-detail:${props.activityId}`)
const { data, error } = await useAsyncData<ActivityDetail>(
  fetchKey,
  () => activityDetailRepository.fetch(props.activityId),
  {
    server: true,
    lazy: false,
  }
)

if (error.value) {
  throw error.value
}

const activity = computed(() => data.value)

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

const hasTranslatedContent = computed(
  () => !!(activity.value?.translatedTitle || activity.value?.translatedBody)
)

watchEffect(() => {
  if (!hasTranslatedContent.value) {
    mode.value = 'original'
  }
})

const displayTitle = computed(() => {
  if (mode.value === 'translated' && hasTranslatedContent.value) {
    return activity.value?.translatedTitle || activity.value?.title || ''
  }
  return activity.value?.title ?? ''
})

const displayBody = computed(() => {
  if (mode.value === 'translated' && hasTranslatedContent.value) {
    return activity.value?.translatedBody || activity.value?.detail || ''
  }
  return activity.value?.detail ?? ''
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
