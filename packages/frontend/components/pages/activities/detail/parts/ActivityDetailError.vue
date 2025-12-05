<script setup lang="ts">
import { computed } from 'vue'
import ClSection from '~/components/base/ClSection.vue'
import ClHeading from '~/components/base/ClHeading.vue'
import ClButton from '~/components/base/ClButton.vue'
import { isNotFoundError } from '~/errors/http-error'

const props = defineProps<{
  error: Error
}>()

const isNotFound = computed(() => isNotFoundError(props.error))

const errorTitle = computed(() =>
  isNotFound.value ? 'ページが見つかりません' : '読み込みエラー'
)

const errorMessage = computed(() =>
  isNotFound.value
    ? 'お探しのアクティビティは存在しないか、削除された可能性があります。'
    : 'アクティビティの読み込み中にエラーが発生しました。しばらく時間をおいてから再度お試しください。'
)

const handleBack = () => {
  navigateTo('/activities')
}
</script>

<template>
  <ClSection
    class="flex flex-col items-center justify-center space-y-6 py-12"
    data-testid="activity-detail-error"
  >
    <div class="space-y-4 text-center">
      <Icon
        name="heroicons:exclamation-circle"
        class="mx-auto h-12 w-12 text-status-alert-default"
        aria-hidden="true"
        size="48"
      />
      <ClHeading :level="1" class="text-2xl text-card-title">
        {{ errorTitle }}
      </ClHeading>
      <p class="text-sm max-w-md text-card-value">
        {{ errorMessage }}
      </p>
      <p
        v-if="error.message && !isNotFound"
        class="text-xs font-mono text-card-value opacity-60"
      >
        {{ error.message }}
      </p>
    </div>
    <div class="flex gap-3">
      <ClButton variant="secondary" @click="handleBack"> 一覧に戻る </ClButton>
    </div>
  </ClSection>
</template>
