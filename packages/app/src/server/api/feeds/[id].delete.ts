import { createSsrApiClient } from '~/lib/api/client'
import { createErrorResponse } from '~/server/utils/api-utils'

export default defineEventHandler(async (event) => {
  const feedId = event.context.params?.id as string

  if (!feedId) {
    throw createError({
      statusCode: 400,
      message: 'Feed ID is required',
    })
  }

  try {
    const apiClient = await createSsrApiClient(event)
    const response = await apiClient.deleteFeedsFeedId(undefined, {
      params: { feedId },
    })

    return response
  } catch (error) {
    const errorResponse = createErrorResponse(error)
    throw createError({
      statusCode: errorResponse.status,
      message: errorResponse.body,
    })
  }
})
