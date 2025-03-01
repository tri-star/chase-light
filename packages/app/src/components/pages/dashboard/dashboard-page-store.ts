import type { FeedLogListItemModel } from '~/features/feed/domain/feed-log'

export const useDashboardPageStore = defineStore('DashboardPageStore', () => {
  const feedLogs = ref<FeedLogListItemModel[]>([])
  const pageNo = ref(1)
  const pageSize = ref(10)

  const { data: loadedList, status: loadListStatus } = useA3Fetch(
    '/api/feeds/logs',
    {
      query: {
        pageSize: pageSize,
        page: pageNo,
      },
    },
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

  return { feedLogs, pageNo, pageSize, loadedList, loadListStatus }
})
