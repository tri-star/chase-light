<script setup lang="ts">
import { computed } from 'vue'
import ClButton from '~/components/base/ClButton.vue'
import type { TranslationRequestStatus } from '~/features/activities/composables/use-translation-request'

const props = defineProps<{
  status: TranslationRequestStatus
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  (e: 'request' | 'retry'): void
}>()

const bannerClass = computed(() => {
  const baseClass =
    'flex items-center justify-between gap-4 rounded-lg border p-4'

  switch (props.status) {
    case 'idle':
      return `${baseClass} border-status-warn-default bg-status-warn-subtle`
    case 'requesting':
    case 'polling':
      return `${baseClass} border-status-warn-default bg-status-warn-subtle`
    case 'failed':
      return `${baseClass} border-status-alert-default bg-status-alert-subtle`
    default:
      return baseClass
  }
})

const iconName = computed(() => {
  switch (props.status) {
    case 'idle':
      return 'i-heroicons-information-circle'
    case 'requesting':
    case 'polling':
      return 'i-heroicons-arrow-path '
    case 'failed':
      return 'i-heroicons-exclamation-triangle'
    default:
      return ''
  }
})

const iconClass = computed(() => {
  switch (props.status) {
    case 'idle':
      return 'text-status-warn-default'
    case 'requesting':
    case 'polling':
      return 'text-status-warn-default animate-spin'
    case 'failed':
      return 'text-status-alert-default'
    default:
      return ''
  }
})

const message = computed(() => {
  switch (props.status) {
    case 'idle':
      return '日本語訳がまだありません'
    case 'requesting':
      return '翻訳リクエストを送信中...'
    case 'polling':
      return '翻訳中... しばらくお待ちください'
    case 'failed':
      return props.errorMessage || '翻訳に失敗しました'
    default:
      return ''
  }
})

const showRequestButton = computed(() => props.status === 'idle')
const showRetryButton = computed(() => props.status === 'failed')
const isProcessing = computed(
  () => props.status === 'requesting' || props.status === 'polling'
)

const handleRequest = () => {
  emit('request')
}

const handleRetry = () => {
  emit('retry')
}
</script>

<template>
  <div :class="bannerClass" data-testid="translation-request-banner">
    <div class="flex items-center gap-3">
      <Icon :name="iconName" :class="iconClass" size="24" />
      <p class="font-normal text-content-default">
        {{ message }}
      </p>
    </div>

    <div class="flex items-center gap-2">
      <ClButton
        v-if="showRequestButton"
        intent="secondary"
        data-testid="request-translation-button"
        @click="handleRequest"
      >
        翻訳をリクエスト
      </ClButton>

      <ClButton
        v-if="showRetryButton"
        size="sm"
        intent="secondary"
        data-testid="retry-translation-button"
        @click="handleRetry"
      >
        再試行
      </ClButton>

      <ClButton
        v-if="isProcessing"
        class="cursor-not-allowed"
        intent="secondary"
        :disabled="true"
        :loading="true"
        data-testid="translation-processing-indicator"
      >
        処理中
      </ClButton>
    </div>
  </div>
</template>
