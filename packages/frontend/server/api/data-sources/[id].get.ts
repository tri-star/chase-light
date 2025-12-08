import { getRouterParam } from 'h3'
import { getApiDataSourcesId } from '~/generated/api/backend'
import type { DataSourceListItem } from '~/generated/api/schemas'
import {
  getApiDataSourcesIdParams,
  getApiDataSourcesIdResponse,
} from '~/generated/api/zod/chaseLightAPI.zod'
import { handleBackendApiError } from '~/server/utils/api'
import { validateWithZod } from '~/utils/validation'

export default defineEventHandler(
  async (
    event
  ): Promise<{
    success: boolean
    data: DataSourceListItem
  }> => {
    const id = getRouterParam(event, 'id')

    const validatedParams = validateWithZod(
      getApiDataSourcesIdParams,
      { id },
      'data source detail params'
    )

    try {
      const response = await getApiDataSourcesId(validatedParams.id)

      if (response.status === 200) {
        return validateWithZod(
          getApiDataSourcesIdResponse,
          response.data,
          'data source detail response'
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
