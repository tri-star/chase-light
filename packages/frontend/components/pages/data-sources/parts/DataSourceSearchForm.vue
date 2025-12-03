<script setup lang="ts">
import ClSelect from '~/components/base/ClSelect.vue'
import type {
  DataSourceSortBy,
  DataSourceSortOrder,
} from '~/features/data-sources/domain/data-source'

interface Props {
  searchQuery: string
  sortBy: DataSourceSortBy
  sortOrder: DataSourceSortOrder
  sortOptions: { value: DataSourceSortBy; label: string }[]
  sortOrderLabel: string
}

defineProps<Props>()

const emit = defineEmits<{
  searchInput: [event: Event]
  sortByChange: [value: DataSourceSortBy]
  toggleSortOrder: []
}>()

const onSearchInput = (event: Event) => {
  emit('searchInput', event)
}

const onSortByChange = (value: DataSourceSortBy) => {
  emit('sortByChange', value)
}

const onToggleSortOrder = () => {
  emit('toggleSortOrder')
}
</script>

<template>
  <div
    class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center
      sm:justify-between"
  >
    <!-- 検索フィールド -->
    <div class="relative flex-1 sm:max-w-sm">
      <Icon
        name="heroicons:magnifying-glass-20-solid"
        class="pointer-events-none absolute top-1/2 left-3 h-5 w-5
          -translate-y-1/2 text-card-value opacity-50"
        aria-hidden="true"
      />
      <input
        type="text"
        :value="searchQuery"
        placeholder="データソースを検索..."
        class="text-sm focus:ring-interactive-focused w-full rounded-md border
          border-surface-secondary-default bg-card-default py-2 pr-4 pl-10
          text-card-value placeholder:text-card-value placeholder:opacity-50
          focus:border-interactive-focused focus:ring-1 focus:outline-none"
        @input="onSearchInput"
      />
    </div>

    <!-- ソートコントロール -->
    <div class="flex items-center gap-2">
      <ClSelect
        :model-value="sortBy"
        :options="sortOptions"
        placement="bottom-right"
        aria-label="ソート順を選択"
        @update:model-value="onSortByChange"
      />

      <button
        type="button"
        class="text-sm inline-flex items-center gap-1 rounded-md border
          border-surface-secondary-default bg-card-default px-3 py-2
          text-card-value hover:bg-card-hovered"
        :aria-label="`ソート順: ${sortOrderLabel}。クリックで切り替え`"
        @click="onToggleSortOrder"
      >
        <Icon
          :name="
            sortOrder === 'desc'
              ? 'heroicons:arrow-down-20-solid'
              : 'heroicons:arrow-up-20-solid'
          "
          class="h-4 w-4"
          aria-hidden="true"
        />
        {{ sortOrderLabel }}
      </button>
    </div>
  </div>
</template>
