<script setup lang="ts">
import ClSection from '~/components/base/ClSection.vue'
import ActivityDetailHeader from './parts/ActivityDetailHeader.vue'
import ActivityDetailContent from './parts/ActivityDetailContent.vue'
import ActivityDetailError from './parts/ActivityDetailError.vue'
import { useActivityDetail } from './use-activity-detail'

const props = defineProps<{
  activityId: string
}>()

const {
  activity,
  error,
  mode,
  pageTitle,
  hasTranslatedContent,
  displayTitle,
  displayBody,
  handleToggleMode,
} = await useActivityDetail(props.activityId)

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
})
</script>

<template>
  <ActivityDetailError v-if="error" :error="error" />
  <ClSection v-else class="space-y-6" data-testid="activity-detail-page">
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
