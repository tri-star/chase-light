<script setup lang="ts">
import ClHeading from '~/components/base/ClHeading.vue'
import ClSection from '~/components/base/ClSection.vue'
import DataSourceList from './parts/DataSourceList.vue'
import DataSourceSearchForm from './parts/DataSourceSearchForm.vue'
import { useDataSourceList } from './use-data-source-list'

const { state, actions, sortOptions, sortOrderLabel } = useDataSourceList()

defineExpose({ loadDataSources: actions.loadDataSources })

onMounted(() => {
  actions.handleLoad()
})
</script>

<template>
  <div ref="targetRef" class="space-y-6">
    <div class="flex items-center justify-between">
      <ClHeading :level="1">データソース一覧</ClHeading>
    </div>

    <div class="flex justify-center">
      <ClSection class="w-full justify-start md:max-w-4/6">
        <!-- 検索フォーム -->
        <DataSourceSearchForm
          :search-query="state.searchQuery.value"
          :sort-by="state.sortBy.value"
          :sort-order="state.sortOrder.value"
          :sort-options="sortOptions"
          :sort-order-label="sortOrderLabel"
          @search-input="actions.onSearchInput"
          @sort-by-change="actions.onSortByChange"
          @toggle-sort-order="actions.toggleSortOrder"
        />

        <!-- データソース一覧 -->
        <DataSourceList
          :data-sources="state.dataSources.value"
          :is-loading="state.isLoading.value"
          :is-initial-loading="state.isInitialLoading.value"
          :has-next-page="state.hasNextPage.value"
          :fetch-error="state.fetchError.value"
          :is-empty="state.isEmpty.value"
          :search-query="state.searchQuery.value"
        />
      </ClSection>
    </div>
  </div>
</template>
