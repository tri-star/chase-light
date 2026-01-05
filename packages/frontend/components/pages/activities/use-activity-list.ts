import type {
  ActivityListItem,
  ActivityListPagination,
} from '~/features/activities/domain/activity-list'
import { ActivityListRepository } from '~/features/activities/repositories/activity-list-repository'

const DEFAULT_PAGINATION: ActivityListPagination = {
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

export interface ActivityListState {
  // データ
  activities: Ref<ActivityListItem[]>
  pagination: Ref<ActivityListPagination>
  fetchError: Ref<string | null>

  // 検索状態
  searchQuery: Ref<string>

  // 計算プロパティ
  hasNextPage: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
  isInitialLoading: ComputedRef<boolean>

  // 無限スクロール状態
  isLoading: Ref<boolean>
  enabled: Ref<boolean>
}

export interface ActivityListActions {
  loadActivities: (reset?: boolean) => Promise<void>
  onSearchInput: (event: Event) => void
  handleLoad: () => void
}

export interface UseActivityListReturn {
  state: ActivityListState
  actions: ActivityListActions
}

export function useActivityList(): UseActivityListReturn {
  // データ状態
  const activities = ref<ActivityListItem[]>([])
  const pagination = ref<ActivityListPagination>({ ...DEFAULT_PAGINATION })
  const fetchError = ref<string | null>(null)
  const enabled = ref(true)

  // 検索状態
  const searchQuery = ref('')

  const repository = new ActivityListRepository()

  // 計算プロパティ
  const hasNextPage = computed(() => pagination.value.hasNext)

  // データ取得
  const loadActivities = async (reset: boolean = false) => {
    if (reset) {
      activities.value = []
      pagination.value = { ...DEFAULT_PAGINATION }
      enabled.value = true
    }

    if (!reset && pagination.value.page > 1 && !hasNextPage.value) {
      enabled.value = false
      return
    }

    try {
      const data = await repository.fetch({
        keyword: searchQuery.value || undefined,
        page: pagination.value.page,
        perPage: pagination.value.perPage,
      })

      activities.value = reset
        ? data.items
        : [...activities.value, ...data.items]
      pagination.value = {
        ...data.pagination,
        page: pagination.value.page + 1,
      }
      fetchError.value = null
      enabled.value = data.pagination.hasNext
    } catch (err) {
      console.error('Failed to load activities:', err)
      fetchError.value =
        err instanceof Error
          ? err.message
          : 'アクティビティの取得に失敗しました'
      enabled.value = false
    }
  }

  // デバウンス付き検索
  const debouncedSearch = useDebounce(() => {
    loadActivities(true)
  }, 300)

  const onSearchInput = (event: Event) => {
    searchQuery.value = (event.target as HTMLInputElement).value
    debouncedSearch()
  }

  // 無限スクロール
  const { isLoading, handleLoad } = useInfiniteScroll(loadActivities, {
    initialLoadingState: true,
    threshold: 200,
    enabled: enabled,
  })

  const isEmpty = computed(
    () => activities.value.length === 0 && !fetchError.value && !isLoading.value
  )

  const isInitialLoading = computed(
    () => isLoading.value && pagination.value.page === 1
  )

  return {
    state: {
      activities,
      pagination,
      fetchError,
      searchQuery,
      hasNextPage,
      isEmpty,
      isInitialLoading,
      isLoading,
      enabled,
    },
    actions: {
      loadActivities,
      onSearchInput,
      handleLoad,
    },
  }
}
