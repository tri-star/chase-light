<script setup lang="ts">
import ClHeading from '~/components/base/ClHeading.vue'
import ClSection from '~/components/base/ClSection.vue'
import ActivitySearchForm from './parts/ActivitySearchForm.vue'
import ActivityList from './parts/ActivityList.vue'
import { useActivityList } from './use-activity-list'

const { state, actions } = useActivityList()

onMounted(() => {
  actions.handleLoad()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <ClHeading :level="1">アクティビティ一覧</ClHeading>
    </div>
    <div class="flex justify-center">
      <ClSection class="w-full max-w-4xl">
        <ActivitySearchForm
          :search-query="state.searchQuery.value"
          @search-input="actions.onSearchInput"
        />
        <ActivityList
          :activities="state.activities.value"
          :is-loading="state.isLoading.value"
          :is-initial-loading="state.isInitialLoading.value"
          :has-next-page="state.hasNextPage.value"
          :fetch-error="state.fetchError.value"
          :is-empty="state.isEmpty.value"
        />
      </ClSection>
    </div>
  </div>
</template>
