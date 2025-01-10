import { createSsrApiClient } from '~/lib/api/client'
import type { FeedLog } from '~/features/feed/domain/feed-log'

export default defineEventHandler(async (event) => {
  const client = await createSsrApiClient(event)
  const response = await client.getFeedLogs()

  const feedLogs: FeedLog[] = response.result.map((feedLog) => {
    return {
      ...feedLog,
    }
  })

  return {
    result: feedLogs,
    page: response.page,
    total: response.total,
    pageSize: response.pageSize,
  }
})
