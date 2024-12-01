import { createSsrApiClient } from "~/lib/api/client"
import type { Feed } from "~/features/feed/domain/feed"

export default defineEventHandler(async (event) => {
  const client = await createSsrApiClient(event)
  const response = await client.getFeeds()

  const feeds: Feed[] = response.result.map((feedLog) => {
    return {
      ...feedLog,
    }
  })

  return {
    result: feeds,
    page: response.page,
    total: response.total,
    pageSize: response.pageSize,
  }
})
