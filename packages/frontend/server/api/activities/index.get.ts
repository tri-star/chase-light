import { getApiActivities } from '~/generated/api/backend'
import type {
  ActivityListResponseData,
  GetApiActivitiesParams,
} from '~/generated/api/schemas'
import {
  getApiActivitiesQueryParams,
  getApiActivitiesResponse,
} from '~/generated/api/zod/chaseLightAPI.zod'
import { validateWithZod } from '~/utils/validation'

export default defineEventHandler(
  async (
    event
  ): Promise<{
    success: boolean
    data: ActivityListResponseData
  }> => {
    const query = getQuery(event)

    const normalizedParams: GetApiActivitiesParams = {
      page: query.page ? Number(query.page) : undefined,
      perPage: query.perPage ? Number(query.perPage) : undefined,
      activityType:
        query.activityType as GetApiActivitiesParams['activityType'],
      status: (query.status as GetApiActivitiesParams['status']) ?? 'completed',
      since: query.since as string,
      until: query.until as string,
      sort: 'updatedAt',
      order: 'desc',
    }

    const validatedParams = validateWithZod(
      getApiActivitiesQueryParams,
      normalizedParams,
      'activities query params'
    )

    try {
      const response = await getApiActivities(validatedParams)

      if (response.status === 200) {
        return validateWithZod(
          getApiActivitiesResponse,
          response.data,
          'activities API response'
        )
      }

      throw createError({
        statusCode: response.status,
        statusMessage: 'Failed to fetch activities',
        data: response.data,
      })
    } catch (error) {
      console.error('Activities BFF error:', error)

      if (error instanceof Error && error.name === 'ValidationError') {
        throw createError({
          statusCode: 502,
          statusMessage: 'Invalid response format from backend API',
          data: { validationError: error.message },
        })
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch activities: ${errorMessage}`,
      })
    }
  }
)
