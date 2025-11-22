<script setup lang="ts">
import ClSection from '~/components/base/ClSection.vue'
import type {
  ActivityListResponse,
  ActivityListResponseDataItemsItem,
  ActivityListResponseDataPagination,
} from '~/generated/api/schemas'
import ActivityItemSkeleton from './ActivityItemSkeleton.vue'
import ActivityListItem from './ActivityListItem.vue'
import ClDivider from '~/components/base/ClDivider.vue'

const DEFAULT_PAGINATION: ActivityListResponseDataPagination = {
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

const enabled = ref(true)
const fetchError = ref<string | null>(null)
const activities = ref<ActivityListResponseDataItemsItem[]>([])
const pagination = ref<ActivityListResponseDataPagination>({
  ...DEFAULT_PAGINATION,
})

const hasNextPage = computed(() => pagination.value.hasNext)
const canLoadMore = computed(() => enabled.value && hasNextPage.value)

const loadMoreActivities = async () => {
  if (!hasNextPage.value) {
    return
  }

  try {
    const { data: loadedData, status } = useFetch<ActivityListResponse>(
      '/api/activities',
      {
        params: {
          page: pagination.value.page + 1,
          perPage: pagination.value.perPage,
        },
      }
    )

    if (status.value === 'success' && loadedData.value) {
      const activityListInfo = loadedData.value.data

      activities.value = [...activities.value, ...activityListInfo.items]
      pagination.value = activityListInfo.pagination
      fetchError.value = null
      enabled.value = activityListInfo.pagination.hasNext
    } else {
      throw new Error('アクティビティの取得に失敗しました')
    }
  } catch (err) {
    console.error('Failed to load more activities:', err)
    fetchError.value =
      err instanceof Error ? err.message : 'アクティビティの取得に失敗しました'
    enabled.value = false
  }
}

defineExpose({ loadMoreActivities })

const {
  data: activitiesResponse,
  status,
  pending,
  error,
} = useFetch<ActivityListResponse>('/api/activities', {
  params: {
    page: DEFAULT_PAGINATION.page,
    perPage: DEFAULT_PAGINATION.perPage,
  },
  server: false,
})

if (status.value === 'success' && activitiesResponse.value) {
  const activityListInfo = activitiesResponse.value.data

  activities.value = activityListInfo.items
  pagination.value = activityListInfo.pagination
  enabled.value = activityListInfo.pagination.hasNext
}

const { isLoading } = useInfiniteScroll(loadMoreActivities, {
  threshold: 200,
  enabled: canLoadMore,
})

const isEmpty = computed(
  () =>
    !pending.value &&
    activities.value.length === 0 &&
    !fetchError.value &&
    !isLoading.value
)

const skeletonPlaceholders = computed(() => Array.from({ length: 10 }))

const errorMessage = computed(() => fetchError.value || error.value?.message)
</script>

<template>
  <ClSection class="w-full justify-start md:max-w-4/6">
    <div v-if="pending && activities.length === 0" class="space-y-6">
      <ActivityItemSkeleton
        v-for="(_, index) in skeletonPlaceholders"
        :key="`skeleton-${index}`"
      />
    </div>

    <div v-else-if="errorMessage" class="py-10 text-center">
      <p class="text-sm text-card-value">
        アクティビティの取得に失敗しました。
      </p>
    </div>

    <div v-else-if="isEmpty" class="py-10 text-center">
      <p class="text-sm font-medium text-card-value">
        まだアクティビティがありません
      </p>
      <p class="text-xs mt-2 text-card-value opacity-70">
        ウォッチ中のリポジトリで更新があるとここに表示されます。
      </p>
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="(activityItem, index) in activities"
        :key="activityItem.activity.id"
      >
        <ActivityListItem :activity="activityItem" />
        <ClDivider v-if="index < activities.length - 1" spacing="sm" />
      </div>
    </div>

    <div
      v-if="isLoading && hasNextPage"
      class="text-sm text-center text-content-default opacity-60"
    >
      読み込み中...
    </div>
  </ClSection>
</template>
