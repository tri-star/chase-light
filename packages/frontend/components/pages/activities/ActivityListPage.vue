<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ActivityListItem from './parts/ActivityListItem.vue'
import ClDivider from '~/components/base/ClDivider.vue'
import ClHeading from '~/components/base/ClHeading.vue'
import ClSection from '~/components/base/ClSection.vue'
import { useInfiniteScroll } from '~/composables/use-infinite-scroll'
import type {
  ActivityListResponse,
  ActivityListResponseDataItemsItem,
  ActivityListResponseDataPagination,
} from '~/generated/api/schemas'

const DEFAULT_PAGINATION: ActivityListResponseDataPagination = {
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

const DEFAULT_RESPONSE: ActivityListResponse = {
  success: true,
  data: {
    items: [],
    pagination: { ...DEFAULT_PAGINATION },
  },
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
    const response = await $fetch<ActivityListResponse>('/api/activities', {
      params: {
        page: pagination.value.page + 1,
        perPage: pagination.value.perPage,
      },
    })

    if (response.success) {
      activities.value = [...activities.value, ...response.data.items]
      pagination.value = response.data.pagination
      fetchError.value = null
      enabled.value = response.data.pagination.hasNext
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
  pending,
  error,
} = await useAsyncData<ActivityListResponse>(
  'activities:list',
  () =>
    $fetch<ActivityListResponse>('/api/activities', {
      params: {
        page: DEFAULT_PAGINATION.page,
        perPage: DEFAULT_PAGINATION.perPage,
      },
    }),
  {
    default: () => DEFAULT_RESPONSE,
    server: true,
    lazy: false,
  }
)

if (activitiesResponse.value.success) {
  activities.value = activitiesResponse.value.data.items
  pagination.value = activitiesResponse.value.data.pagination
  enabled.value = activitiesResponse.value.data.pagination.hasNext
}

watch(activitiesResponse, (response) => {
  if (response.success) {
    activities.value = response.data.items
    pagination.value = response.data.pagination
    fetchError.value = null
    enabled.value = response.data.pagination.hasNext
  }
})

watch(error, (newError) => {
  fetchError.value = newError ? newError.message : null
})

const { targetRef, isLoading } = useInfiniteScroll(loadMoreActivities, {
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

const skeletonPlaceholders = computed(() => Array.from({ length: 4 }))

const errorMessage = computed(() => fetchError.value || error.value?.message)
</script>

<template>
  <div ref="targetRef" class="space-y-6">
    <div class="flex items-center justify-between">
      <ClHeading :level="1">アクティビティ一覧</ClHeading>
    </div>

    <ClSection>
      <div v-if="pending && activities.length === 0" class="space-y-6">
        <div
          v-for="(_, index) in skeletonPlaceholders"
          :key="`skeleton-${index}`"
          class="space-y-4"
        >
          <div
            class="flex flex-col gap-2 sm:flex-row sm:items-center
              sm:justify-between"
          >
            <div
              class="rounded h-4 w-24 animate-pulse
                bg-surface-secondary-default"
            ></div>
            <div
              class="rounded h-6 w-20 animate-pulse
                bg-surface-secondary-default"
            ></div>
          </div>
          <div class="space-y-3">
            <div
              class="rounded h-4 w-2/3 animate-pulse
                bg-surface-secondary-default"
            ></div>
            <div
              class="rounded h-4 w-full animate-pulse
                bg-surface-secondary-default"
            ></div>
            <div
              class="rounded h-3 w-3/4 animate-pulse
                bg-surface-secondary-default"
            ></div>
          </div>
        </div>
      </div>

      <div v-else-if="errorMessage" class="py-10 text-center">
        <p class="text-sm text-card-value">
          アクティビティの取得に失敗しました。
        </p>
        <p class="text-xs mt-2 text-card-value opacity-70">
          {{ errorMessage }}
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
    </ClSection>

    <div
      v-if="isLoading && hasNextPage"
      class="text-sm text-center text-content-default opacity-60"
    >
      読み込み中...
    </div>
  </div>
</template>
