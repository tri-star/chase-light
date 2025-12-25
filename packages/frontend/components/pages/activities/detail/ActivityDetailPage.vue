<script setup lang="ts">
import ClSection from '~/components/base/ClSection.vue'
import ActivityDetailHeader from './parts/ActivityDetailHeader.vue'
import ActivityDetailContent from './parts/ActivityDetailContent.vue'
import ActivityDetailError from './parts/ActivityDetailError.vue'
import { useActivityDetail } from './use-activity-detail'
import {
  useTranslationRequest,
  type TranslationRequestStatus,
} from '~/features/activities/composables/use-translation-request'
import { watch } from 'vue'

const props = defineProps<{
  activityId: string
}>()

const {
  activity,
  error,
  mode,
  pageTitle,
  hasTranslatedContent,
  hasTranslatedBody,
  displayTitle,
  displayBody,
  handleToggleMode,
  refresh,
} = await useActivityDetail(props.activityId)

// 翻訳リクエスト機能
// bodyTranslationStatus を TranslationRequestStatus に変換
const mapToTranslationStatus = (
  backendStatus: string | undefined
): TranslationRequestStatus | undefined => {
  if (!backendStatus) return undefined
  // idle, completed, failed はそのまま
  if (
    backendStatus === 'idle' ||
    backendStatus === 'completed' ||
    backendStatus === 'failed'
  ) {
    return backendStatus as TranslationRequestStatus
  }
  // queued, processing は polling として扱う
  if (backendStatus === 'queued' || backendStatus === 'processing') {
    return 'polling'
  }
  return undefined
}

const {
  status: translationStatus,
  errorMessage: translationErrorMessage,
  requestTranslation,
  onTranslationComplete,
  syncStatusFromBackend,
} = useTranslationRequest(
  props.activityId,
  mapToTranslationStatus(activity.value?.bodyTranslationStatus)
)

watch(
  () => activity.value?.bodyTranslationStatus,
  (backendStatus) => {
    syncStatusFromBackend(mapToTranslationStatus(backendStatus))
  },
  { immediate: true }
)

// 翻訳完了時にアクティビティデータを再取得
onTranslationComplete.value = async () => {
  await refresh()
}

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
        :has-translated-body="hasTranslatedBody"
        :translation-status="translationStatus"
        :translation-error-message="translationErrorMessage"
        @request-translation="requestTranslation"
      />
    </template>
  </ClSection>
</template>
