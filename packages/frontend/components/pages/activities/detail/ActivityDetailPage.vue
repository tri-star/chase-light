<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import ClSection from '~/components/base/ClSection.vue'
import type { ActivityDetailResponseData } from '~/generated/api/schemas'
import ActivityDetailHeader from './parts/ActivityDetailHeader.vue'
import ActivityDetailContent from './parts/ActivityDetailContent.vue'

const props = defineProps<{
  activity: ActivityDetailResponseData['activity']
}>()

type DisplayMode = 'translated' | 'original'

const mode = ref<DisplayMode>('translated')

const hasTranslatedContent = computed(
  () => !!(props.activity.translatedTitle || props.activity.translatedBody)
)

watchEffect(() => {
  if (!hasTranslatedContent.value) {
    mode.value = 'original'
  }
})

const displayTitle = computed(() => {
  if (mode.value === 'translated' && hasTranslatedContent.value) {
    return props.activity.translatedTitle || props.activity.title
  }
  return props.activity.title
})

const displayBody = computed(() => {
  if (mode.value === 'translated' && hasTranslatedContent.value) {
    return props.activity.translatedBody || props.activity.detail
  }
  return props.activity.detail
})

const handleToggleMode = () => {
  if (!hasTranslatedContent.value) return
  mode.value = mode.value === 'translated' ? 'original' : 'translated'
}
</script>

<template>
  <ClSection class="space-y-6" data-testid="activity-detail-page">
    <ActivityDetailHeader
      :activity="props.activity"
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
  </ClSection>
</template>
