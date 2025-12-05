import { computed, ref, watch } from 'vue'
import { ActivityDetailRepository } from '~/features/activities/repositories/activity-detail-repository'
import type { ActivityDetail } from '~/features/activities/domain/activity'

export type DisplayMode = 'translated' | 'original'

export function useActivityDetail(activityId: string) {
  const mode = ref<DisplayMode>('translated')
  const isUserToggled = ref(false)
  const activityDetailRepository = new ActivityDetailRepository()

  const fetchKey = computed(() => `activity-detail:${activityId}`)
  const { data, error } = useAsyncData<ActivityDetail>(
    fetchKey.value,
    () => activityDetailRepository.fetch(activityId),
    {
      server: true,
      lazy: false,
    }
  )

  const activity = computed(() => data.value)

  const pageTitle = computed(
    () =>
      activity.value?.translatedTitle ||
      activity.value?.title ||
      'アクティビティ詳細'
  )

  const hasTranslatedContent = computed(
    () => !!(activity.value?.translatedTitle || activity.value?.translatedBody)
  )

  // ユーザーがトグルしていない場合のみ、翻訳コンテンツの有無に応じて自動設定
  watch(
    hasTranslatedContent,
    (hasTranslation) => {
      if (!isUserToggled.value) {
        mode.value = hasTranslation ? 'translated' : 'original'
      }
    },
    { immediate: true }
  )

  const displayTitle = computed(() => {
    if (mode.value === 'translated') {
      return activity.value?.translatedTitle || activity.value?.title || ''
    }
    return activity.value?.title ?? ''
  })

  const displayBody = computed(() => {
    if (mode.value === 'translated') {
      return activity.value?.translatedBody || activity.value?.detail || ''
    }
    return activity.value?.detail ?? ''
  })

  const handleToggleMode = () => {
    if (!hasTranslatedContent.value) return
    isUserToggled.value = true
    mode.value = mode.value === 'translated' ? 'original' : 'translated'
  }

  return {
    activity,
    error,
    mode,
    pageTitle,
    hasTranslatedContent,
    displayTitle,
    displayBody,
    handleToggleMode,
  }
}
