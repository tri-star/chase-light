import { createSsrApiClient } from '~/lib/api/client'
import type { FeedLogListItemModel } from '~/features/feed/domain/feed-log'

export default defineEventHandler(async (event) => {
  const client = await createSsrApiClient(event)
  const response = await client.getFeedLogs()

  const feedLogs: FeedLogListItemModel[] = response.result.map((feedLog) => {
    return {
      ...feedLog,
      items: feedLog.items.map((item) => item),
    }
  })

  return {
    result: feedLogs,
    page: response.page,
    total: response.total,
    pageSize: response.pageSize,
  }
})
