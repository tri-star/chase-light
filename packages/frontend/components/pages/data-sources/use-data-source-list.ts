import type {
  DataSourceListItem,
  DataSourceSortBy,
  DataSourceSortOrder,
} from '~/features/data-sources/domain/data-source'
import type { Pagination } from '~/generated/api/schemas'
import { DataSourceListRepository } from '~/features/data-sources/repositories/data-source-list-repository'

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

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

export interface DataSourceListState {
  // データ
  dataSources: Ref<DataSourceListItem[]>
  pagination: Ref<Pagination>
  fetchError: Ref<string | null>

  // 検索・ソート状態
  searchQuery: Ref<string>
  sortBy: Ref<DataSourceSortBy>
  sortOrder: Ref<DataSourceSortOrder>

  // 計算プロパティ
  hasNextPage: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
  isInitialLoading: ComputedRef<boolean>

  // 無限スクロール状態
  isLoading: Ref<boolean>
  enabled: Ref<boolean>
}

export interface DataSourceListActions {
  loadDataSources: (reset?: boolean) => Promise<void>
  onSearchInput: (event: Event) => void
  onSortByChange: (value: DataSourceSortBy) => void
  toggleSortOrder: () => void
  handleLoad: () => void
}

export interface UseDataSourceListReturn {
  state: DataSourceListState
  actions: DataSourceListActions
  sortOptions: { value: DataSourceSortBy; label: string }[]
  currentSortLabel: ComputedRef<string>
  sortOrderLabel: ComputedRef<string>
}

export function useDataSourceList(): UseDataSourceListReturn {
  // データ状態
  const dataSources = ref<DataSourceListItem[]>([])
  const pagination = ref<Pagination>({ ...DEFAULT_PAGINATION })
  const fetchError = ref<string | null>(null)
  const enabled = ref(true)

  // 検索・ソート状態
  const searchQuery = ref('')
  const sortBy = ref<DataSourceSortBy>('updatedAt')
  const sortOrder = ref<DataSourceSortOrder>('desc')

  const repository = new DataSourceListRepository()

  // 計算プロパティ
  const hasNextPage = computed(() => pagination.value.hasNext)

  // ソートオプション
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

  // データ取得
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

  const onSortByChange = (value: DataSourceSortBy) => {
    sortBy.value = value
    loadDataSources(true)
  }

  const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
    loadDataSources(true)
  }

  // 無限スクロール
  const { isLoading, handleLoad } = useInfiniteScroll(loadDataSources, {
    initialLoadingState: true,
    threshold: 200,
    enabled: enabled,
  })

  const isEmpty = computed(
    () =>
      dataSources.value.length === 0 && !fetchError.value && !isLoading.value
  )

  const isInitialLoading = computed(
    () => isLoading.value && pagination.value.page === 1
  )

  return {
    state: {
      dataSources,
      pagination,
      fetchError,
      searchQuery,
      sortBy,
      sortOrder,
      hasNextPage,
      isEmpty,
      isInitialLoading,
      isLoading,
      enabled,
    },
    actions: {
      loadDataSources,
      onSearchInput,
      onSortByChange,
      toggleSortOrder,
      handleLoad,
    },
    sortOptions,
    currentSortLabel,
    sortOrderLabel,
  }
}
