<script setup lang="ts">
import ClSection from '~/components/base/ClSection.vue'
import ClDivider from '~/components/base/ClDivider.vue'
import ClDropdownMenu from '~/components/base/ClDropdownMenu.vue'
import ClMenuItem from '~/components/base/ClMenuItem.vue'
import type {
  DataSourceListItem,
  DataSourceSortBy,
  DataSourceSortOrder,
} from '~/features/data-sources/domain/data-source'
import type { Pagination } from '~/generated/api/schemas'
import { DataSourceListRepository } from '~/features/data-sources/repositories/data-source-list-repository'
import DataSourceItemSkeleton from './DataSourceItemSkeleton.vue'
import DataSourceListItemComponent from './DataSourceListItem.vue'

// シンプルなデバウンス関数
function useDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }) as T
}

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

const enabled = ref(true)
const fetchError = ref<string | null>(null)
const dataSources = ref<DataSourceListItem[]>([])
const pagination = ref<Pagination>({
  ...DEFAULT_PAGINATION,
})

// 検索・ソート状態
const searchQuery = ref('')
const sortBy = ref<DataSourceSortBy>('updatedAt')
const sortOrder = ref<DataSourceSortOrder>('desc')

const repository = new DataSourceListRepository()

const hasNextPage = computed(() => pagination.value.hasNext)

const sortOptions: { value: DataSourceSortBy; label: string }[] = [
  { value: 'updatedAt', label: '更新日時' },
  { value: 'name', label: '名前' },
  { value: 'addedAt', label: '追加日時' },
  { value: 'starsCount', label: 'スター数' },
  { value: 'createdAt', label: '作成日時' },
]

const currentSortLabel = computed(() => {
  const option = sortOptions.find((o) => o.value === sortBy.value)
  return option?.label ?? '更新日時'
})

const sortOrderLabel = computed(() =>
  sortOrder.value === 'desc' ? '降順' : '昇順'
)

const loadDataSources = async (reset: boolean = false) => {
  if (reset) {
    dataSources.value = []
    pagination.value = { ...DEFAULT_PAGINATION }
    enabled.value = true
  }

  if (!reset && pagination.value.page > 1 && !hasNextPage.value) {
    enabled.value = false
    return
  }

  try {
    const data = await repository.fetch({
      search: searchQuery.value || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      page: pagination.value.page,
      perPage: pagination.value.perPage,
    })

    dataSources.value = reset
      ? data.items
      : [...dataSources.value, ...data.items]
    pagination.value = {
      ...data.pagination,
      page: pagination.value.page + 1,
    }
    fetchError.value = null
    enabled.value = data.pagination.hasNext
  } catch (err) {
    console.error('Failed to load data sources:', err)
    fetchError.value =
      err instanceof Error ? err.message : 'データソースの取得に失敗しました'
    enabled.value = false
  }
}

// デバウンス付き検索
const debouncedSearch = useDebounce(() => {
  loadDataSources(true)
}, 300)

const onSearchInput = (event: Event) => {
  searchQuery.value = (event.target as HTMLInputElement).value
  debouncedSearch()
}

const onSortBySelect = (value: string) => {
  sortBy.value = value as DataSourceSortBy
  loadDataSources(true)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  loadDataSources(true)
}

defineExpose({ loadDataSources })

const { isLoading, handleLoad } = useInfiniteScroll(loadDataSources, {
  initialLoadingState: true,
  threshold: 200,
  enabled: enabled,
})

const isEmpty = computed(
  () => dataSources.value.length === 0 && !fetchError.value && !isLoading.value
)

const skeletonPlaceholders = computed(() => Array.from({ length: 10 }))

onMounted(() => {
  handleLoad()
})
</script>

<template>
  <ClSection class="w-full justify-start md:max-w-4/6">
    <!-- 検索・ソートエリア -->
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
        <ClDropdownMenu placement="bottom-right" aria-label="ソート順を選択">
          <template
            #trigger="{ triggerProps, triggerEvents, triggerRef, isOpen }"
          >
            <button
              v-bind="triggerProps"
              :ref="(el) => triggerRef(el as HTMLElement)"
              type="button"
              class="text-sm inline-flex items-center gap-2 rounded-md border
                border-surface-secondary-default bg-card-default px-4 py-2
                text-card-value hover:bg-card-hovered"
              @click="triggerEvents.onClick"
              @keydown="triggerEvents.onKeydown"
            >
              {{ currentSortLabel }}
              <Icon
                :name="
                  isOpen
                    ? 'heroicons:chevron-up-20-solid'
                    : 'heroicons:chevron-down-20-solid'
                "
                class="h-4 w-4"
                aria-hidden="true"
              />
            </button>
          </template>
          <template #default="{ close }">
            <ClMenuItem
              v-for="option in sortOptions"
              :id="option.value"
              :key="option.value"
              @click="
                () => {
                  onSortBySelect(option.value)
                  close()
                }
              "
            >
              {{ option.label }}
            </ClMenuItem>
          </template>
        </ClDropdownMenu>

        <button
          type="button"
          class="text-sm inline-flex items-center gap-1 rounded-md border
            border-surface-secondary-default bg-card-default px-3 py-2
            text-card-value hover:bg-card-hovered"
          :aria-label="`ソート順: ${sortOrderLabel}。クリックで切り替え`"
          @click="toggleSortOrder"
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

    <!-- ローディング（初回） -->
    <div v-if="isLoading && pagination.page === 1" class="space-y-6">
      <DataSourceItemSkeleton
        v-for="(_, index) in skeletonPlaceholders"
        :key="`skeleton-${index}`"
      />
    </div>

    <!-- エラー表示 -->
    <div v-else-if="fetchError" class="py-10 text-center">
      <p class="text-sm text-card-value">データソースの取得に失敗しました。</p>
    </div>

    <!-- 空状態 -->
    <div v-else-if="isEmpty" class="py-10 text-center">
      <p class="text-sm font-medium text-card-value">
        {{
          searchQuery
            ? '検索条件に一致するデータソースがありません'
            : 'まだデータソースがありません'
        }}
      </p>
      <p v-if="!searchQuery" class="text-xs mt-2 text-card-value opacity-70">
        ダッシュボードからデータソースを追加してください。
      </p>
    </div>

    <!-- データソース一覧 -->
    <div v-else class="space-y-6">
      <div v-for="(item, index) in dataSources" :key="item.dataSource.id">
        <DataSourceListItemComponent :item="item" />
        <ClDivider v-if="index < dataSources.length - 1" spacing="sm" />
      </div>
    </div>

    <!-- 追加読み込み中 -->
    <div
      v-if="isLoading && hasNextPage"
      class="text-sm mt-6 text-center text-content-default opacity-60"
    >
      読み込み中...
    </div>
  </ClSection>
</template>
