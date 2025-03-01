import { createSsrApiClient } from '~/lib/api/client'
import {
  feedLogListItemModelSchema,
  type FeedLogListItemModel,
} from '~/features/feed/domain/feed-log'

export default defineEventHandler(async (event) => {
  const client = await createSsrApiClient(event)
  const queries = getQuery(event)
  const response = await client.getFeedLogs({
    queries: {
      page: String(queries['page']),
      pageSize: String(queries['pageSize']),
    },
  })

  const feedLogs: FeedLogListItemModel[] = response.result.map((feedLog) => {
    return feedLogListItemModelSchema.parse(feedLog)
  })

  return {
    result: feedLogs,
    page: response.page,
    total: response.total,
    pageSize: response.pageSize,
  }
})
