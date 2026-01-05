<script setup lang="ts">
import ClTextField from '~/components/base/ClTextField.vue'

interface Props {
  searchQuery: string
}

defineProps<Props>()

const emit = defineEmits<{
  searchInput: [event: Event]
}>()

const onSearchInput = (value: string) => {
  // ClTextFieldのinputイベントは値を直接渡すので、Eventオブジェクトを構築
  const event = new Event('input', { bubbles: true })
  Object.defineProperty(event, 'target', {
    writable: false,
    value: { value },
  })
  emit('searchInput', event)
}

const onClearSearch = () => {
  onSearchInput('')
}
</script>

<template>
  <div class="mb-6">
    <ClTextField
      :model-value="searchQuery"
      type="text"
      placeholder="キーワードで検索..."
      aria-label="アクティビティ検索フィールド"
      @input="onSearchInput"
    >
      <template #prefix>
        <Icon name="heroicons:magnifying-glass" size="20" aria-hidden="true" />
      </template>
      <template v-if="searchQuery" #suffix>
        <button
          type="button"
          class="h-5 hover:text-card-value"
          aria-label="検索キーワードをクリア"
          @click="onClearSearch"
        >
          <Icon name="heroicons:x-mark" size="20" aria-hidden="true" />
        </button>
      </template>
    </ClTextField>
  </div>
</template>
