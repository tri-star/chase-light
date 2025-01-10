import { createSsrApiClient } from '~/lib/api/client'
import type { Feed } from '~/features/feed/domain/feed'
import { makeEnumFromArray } from 'core/utils/zod-utils'
import { SORT_ITEMS_VALUES } from 'core/features/feed/feed'
import { SORT_DIRECTION_VALUES } from 'core/constants'

export default defineEventHandler(async (event) => {
  const client = await createSsrApiClient(event)

  const sortItemSchema = makeEnumFromArray(SORT_ITEMS_VALUES).optional()
  const sortDirectionSchema = makeEnumFromArray(
    SORT_DIRECTION_VALUES,
  ).optional()

  const queries = getQuery(event)

  const response = await client.getFeeds({
    queries: {
      keyword: queries['keyword'] == null ? undefined : `${queries['keyword']}`,
      sort: sortItemSchema.parse(queries['sort'] ?? undefined),
      sortDirection: sortDirectionSchema.parse(
        queries['sortDirection'] ?? undefined,
      ),
    },
  })

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
