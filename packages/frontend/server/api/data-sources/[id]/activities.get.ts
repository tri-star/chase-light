import { getRouterParam } from 'h3'
import { getApiDataSourcesDataSourceIdActivities } from '~/generated/api/backend'
import type {
  DataSourceActivityListResponseData,
  GetApiDataSourcesDataSourceIdActivitiesParams,
  GetApiDataSourcesDataSourceIdActivitiesActivityType,
  GetApiDataSourcesDataSourceIdActivitiesStatus,
  GetApiDataSourcesDataSourceIdActivitiesSort,
  GetApiDataSourcesDataSourceIdActivitiesOrder,
} from '~/generated/api/schemas'
import {
  getApiDataSourcesDataSourceIdActivitiesParams,
  getApiDataSourcesDataSourceIdActivitiesQueryParams,
  getApiDataSourcesDataSourceIdActivitiesResponse,
} from '~/generated/api/zod/chaseLightAPI.zod'
import { handleBackendApiError } from '~/server/utils/api'
import { validateWithZod } from '~/utils/validation'

export default defineEventHandler(
  async (
    event
  ): Promise<{
    success: true
    data: DataSourceActivityListResponseData
  }> => {
    const dataSourceId = getRouterParam(event, 'id')

    // パスパラメータをバリデーション
    const validatedPathParams = validateWithZod(
      getApiDataSourcesDataSourceIdActivitiesParams,
      { dataSourceId },
      'data source activities path params'
    )

    // クエリパラメータを取得
    const query = getQuery(event)
    const queryParams: GetApiDataSourcesDataSourceIdActivitiesParams = {
      page: query.page ? parseInt(query.page as string, 10) : undefined,
      perPage: query.perPage
        ? parseInt(query.perPage as string, 10)
        : undefined,
      activityType:
        query.activityType as GetApiDataSourcesDataSourceIdActivitiesActivityType,
      status: query.status as GetApiDataSourcesDataSourceIdActivitiesStatus,
      since: query.since as string,
      until: query.until as string,
      sort: query.sort as GetApiDataSourcesDataSourceIdActivitiesSort,
      order: query.order as GetApiDataSourcesDataSourceIdActivitiesOrder,
    }

    // 未定義値を除去
    const cleanQueryParams = Object.fromEntries(
      Object.entries(queryParams).filter(([, value]) => value !== undefined)
    ) as GetApiDataSourcesDataSourceIdActivitiesParams

    // クエリパラメータをバリデーション
    const validatedQueryParams = validateWithZod(
      getApiDataSourcesDataSourceIdActivitiesQueryParams,
      cleanQueryParams,
      'data source activities query params'
    )

    try {
      const response = await getApiDataSourcesDataSourceIdActivities(
        validatedPathParams.dataSourceId,
        validatedQueryParams
      )

      if (response.status === 200) {
        return validateWithZod(
          getApiDataSourcesDataSourceIdActivitiesResponse,
          response.data,
          'data source activities response'
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
