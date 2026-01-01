<script setup lang="ts">
import ClHeading from '~/components/base/ClHeading.vue'
import ClTextField from '~/components/base/ClTextField.vue'
import ActivityList from './parts/ActivityList.vue'

const filterKeyword = ref('')
const debouncedKeyword = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(filterKeyword, (newValue) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debouncedKeyword.value = newValue
  }, 300)
})
</script>

<template>
  <div ref="targetRef" class="space-y-6">
    <div class="flex items-center justify-between">
      <ClHeading :level="1">アクティビティ一覧</ClHeading>
    </div>

    <div class="flex justify-center">
      <div class="w-full max-w-4xl space-y-6">
        <ClTextField
          v-model="filterKeyword"
          type="search"
          placeholder="キーワードで検索..."
          aria-label="アクティビティ検索フィールド"
        >
          <template #prefix>
            <Icon
              name="heroicons:magnifying-glass"
              class="absolute left-3 h-5 w-5 text-card-label"
              aria-hidden="true"
            />
          </template>
          <template v-if="filterKeyword" #suffix>
            <button
              type="button"
              class="absolute right-3 text-card-label hover:text-card-value"
              aria-label="検索キーワードをクリア"
              @click="filterKeyword = ''"
            >
              <Icon
                name="heroicons:x-mark"
                class="h-5 w-5"
                aria-hidden="true"
              />
            </button>
          </template>
        </ClTextField>

        <ActivityList :keyword="debouncedKeyword" />
      </div>
    </div>
  </div>
</template>
