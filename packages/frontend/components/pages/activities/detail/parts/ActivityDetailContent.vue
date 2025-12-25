<script setup lang="ts">
import { computed } from 'vue'
import ClHeading from '~/components/base/ClHeading.vue'
import ClIconButton from '~/components/base/ClIconButton.vue'
import TranslationRequestBanner from './TranslationRequestBanner.vue'
import type { TranslationRequestStatus } from '~/features/activities/composables/use-translation-request'

const props = defineProps<{
  title: string
  body: string
  mode: 'translated' | 'original'
  hasTranslatedContent: boolean
  hasTranslatedBody: boolean
  translationStatus?: TranslationRequestStatus
  translationErrorMessage?: string | null
}>()

const emit = defineEmits<{
  (e: 'requestTranslation'): void
}>()

const modeLabel = computed(() =>
  props.mode === 'translated' && props.hasTranslatedContent
    ? '翻訳結果'
    : '原文'
)

const showTranslationBanner = computed(() => {
  // 翻訳済み本文がない場合に表示
  // ただし、翻訳完了状態の場合は非表示（データ再取得後に翻訳結果が表示されるため）
  return (
    !props.hasTranslatedBody &&
    props.translationStatus &&
    props.translationStatus !== 'completed'
  )
})

const handleRequestTranslation = () => {
  emit('requestTranslation')
}
</script>

<template>
  <section class="space-y-4">
    <div
      class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
    >
      <div class="space-y-2">
        <div class="text-xs tracking-wide text-card-value uppercase opacity-60">
          {{ modeLabel }}
        </div>
        <ClHeading :level="1" class="text-2xl text-card-title">
          {{ props.title }}
        </ClHeading>
      </div>

      <div
        class="flex items-center gap-2 rounded-full
          bg-surface-secondary-default/60 p-2"
        data-testid="activity-actions"
      >
        <!-- eslint-disable vue/attribute-hyphenation -->
        <ClIconButton
          ariaLabel="共有する"
          icon="i-heroicons-share-20-solid"
          size="sm"
        />
        <ClIconButton
          ariaLabel="保存する"
          icon="i-heroicons-bookmark-20-solid"
          size="sm"
        />
        <ClIconButton
          ariaLabel="いいねする"
          icon="i-heroicons-hand-thumb-up-20-solid"
          size="sm"
        />
        <!-- eslint-enable vue/attribute-hyphenation -->
      </div>
    </div>

    <!-- 翻訳リクエストバナー -->
    <TranslationRequestBanner
      v-if="showTranslationBanner"
      :status="translationStatus!"
      :error-message="translationErrorMessage"
      @request="handleRequestTranslation"
      @retry="handleRequestTranslation"
    />

    <div
      class="rounded-lg border border-surface-secondary-default
        bg-surface-secondary-default/50 p-4"
    >
      <p
        data-testid="activity-body"
        class="text-sm leading-relaxed whitespace-pre-wrap text-card-value"
      >
        {{ props.body }}
      </p>
    </div>
  </section>
</template>
