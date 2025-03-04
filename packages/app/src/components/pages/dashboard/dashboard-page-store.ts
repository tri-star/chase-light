import type { AsyncDataRequestStatus } from '#app'
import type { FeedLogListItemModel } from '~/features/feed/domain/feed-log'

export const useDashboardPageStore = defineStore('DashboardPageStore', () => {
  const feedLogs = ref<FeedLogListItemModel[]>([])
  const pageNo = ref(1)
  const pageSize = 10
  const loadingStatus = ref<AsyncDataRequestStatus>('idle')
  const hasMore = ref(true)

  async function fetchFeedLogs(page: number) {
    try {
      if (!hasMore.value) {
        return
      }
      loadingStatus.value = 'pending'
      const { data: loadedList, error } = await useA3Fetch('/api/feeds/logs', {
        query: {
          pageSize: pageSize,
          page,
        },
      })

      if (error.value) {
        console.error('ロードに失敗しました。', error.value)
        loadingStatus.value = 'error'
        return
      }

      if (loadedList.value?.result.length === 0) {
        hasMore.value = false
      }

      loadingStatus.value = 'success'
      pageNo.value = page
      feedLogs.value.push(...(loadedList.value?.result ?? []))
    } catch (_e: unknown) {
      console.error('ロード中に予期しないエラーが発生しました', _e)
      loadingStatus.value = 'error'
    }
  }

  return {
    feedLogs,
    pageNo,
    loadingStatus,
    fetchFeedLogs,
  }
})
