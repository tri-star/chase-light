import { Feed } from '~/features/feed/domain/feed'
import { createSsrApiClient } from '~/lib/api/client'
import { createErrorResponse } from '~/server/utils/api-utils'

export type GetFeedResponse = {
  feed: Feed
  lastReleaseDate: string | null
}

export default defineEventHandler(async (event): Promise<GetFeedResponse> => {
  const feedId = event.context.params?.id as string

  if (!feedId) {
    throw createError({
      statusCode: 400,
      message: 'Feed ID is required',
    })
  }

  try {
    const apiClient = await createSsrApiClient(event)
    const response = await apiClient.getFeedsFeedId({ params: { feedId } })

    return {
      feed: response.feed,
      lastReleaseDate: response.lastReleaseDate ?? null,
    }
  } catch (error) {
    const errorResponse = createErrorResponse(error)
    throw createError({
      statusCode: errorResponse.status,
      message: errorResponse.body,
    })
  }
})
