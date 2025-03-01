<script setup lang="ts">
import A3Button from '~/components/common/A3Button.vue'
import A3Spinner from '~/components/common/A3Spinner.vue'
import { SIDE_MENU_ITEM_MAP } from '~/components/common/side-menu/side-menu'
import LogCard from '~/components/feed/LogCard.vue'
import { useInfiniteScroll } from '~/composables/use-infinite-scroll'
import type { FeedLogListItemModel } from '~/features/feed/domain/feed-log'

const router = useRouter()

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.dashboard.id,
})

const { observe, hasNextPage } = useInfiniteScroll()

const feedLogs = ref<FeedLogListItemModel[]>([])
const loadMoreRef = ref<HTMLDivElement | null>(null)
const pageNo = ref(1)
const pageSize = 10
const { data: loadedList, status: loadListStatus } = useA3Fetch(
  '/api/feeds/logs',
  {
    query: {
      pageSize: pageSize,
      page: pageNo,
    },
  }
)

watch(loadedList, (newList) => {
  if (newList == null) {
    console.warn('newList is null')
    return
  }
  for (const log of newList.result) {
    feedLogs.value.push(log)
  }
})

onMounted(() => {
  observe(loadMoreRef, (isIntersecting) => {
    if (!isIntersecting) {
      return
    }
    if (loadListStatus.value === 'pending') {
      return
    }
    const paginationInfo = {
      page: pageNo.value,
      total: loadedList.value?.total ?? 0,
      pageSize: pageSize,
    }
    if (!hasNextPage(paginationInfo)) {
      return
    }
    pageNo.value++
  })
})

function handleAddFeedClick() {
  router.push({ path: '/feeds/new' })
}
</script>

<template>
  <div
    class="bg-default flex flex-col rounded-2xl p-4 md:w-[800px] lg:w-[1024px]"
  >
    <div class="flex flex-col gap-6">
      <div class="flex items-center">
        <h1 class="flex-1">新着情報</h1>
        <A3Button
          label="フィード登録"
          type="primary"
          @click="handleAddFeedClick"
        />
      </div>

      <div class="flex flex-col items-center gap-4">
        <LogCard
          v-for="feedLog in feedLogs ?? []"
          :key="feedLog.id"
          :feed-log="feedLog"
        />
        <div ref="loadMoreRef" class="flex w-full items-center justify-center">
          <A3Spinner
            v-if="loadListStatus === 'pending'"
            size-class="h-7 w-7"
            color="gray"
          />
        </div>
      </div>
    </div>
  </div>
</template>
