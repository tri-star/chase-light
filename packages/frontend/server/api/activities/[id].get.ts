import { getRouterParam } from 'h3'
import { getApiActivitiesActivityId } from '~/generated/api/backend'
import type { ActivityDetailResponseData } from '~/generated/api/schemas'
import {
  getApiActivitiesActivityIdParams,
  getApiActivitiesActivityIdResponse,
} from '~/generated/api/zod/chaseLightAPI.zod'
import { handleBackendApiError } from '~/server/utils/api'
import { validateWithZod } from '~/utils/validation'

export default defineEventHandler(
  async (
    event
  ): Promise<{
    success: true
    data: ActivityDetailResponseData
  }> => {
    const activityId = getRouterParam(event, 'id')

    const validatedParams = validateWithZod(
      getApiActivitiesActivityIdParams,
      { activityId },
      'activity detail params'
    )

    try {
      const response = await getApiActivitiesActivityId(
        validatedParams.activityId
      )

      if (response.status === 200) {
        return validateWithZod(
          getApiActivitiesActivityIdResponse,
          response.data,
          'activity detail response'
        )
      }

      throw Object.assign(
        new Error(`Backend API returned status ${response.status}`),
        {
          status: response.status,
          data: response.data,
        }
      )
    } catch (error) {
      handleBackendApiError(error)
    }
  }
)
