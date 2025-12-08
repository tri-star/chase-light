import type { DataSourceActivityListResponse } from '~/generated/api/schemas'
import { toHttpError } from '~/errors/http-error'
import type { DataSourceActivityListResponseData } from '../domain/data-source-detail'

export interface DataSourceActivitiesParams {
  page?: number
  perPage?: number
  activityType?: 'release' | 'issue' | 'pull_request'
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  since?: string
  until?: string
  sort?: 'createdAt' | 'updatedAt'
  order?: 'asc' | 'desc'
}

export class DataSourceActivitiesRepository {
  async fetch(
    dataSourceId: string,
    params: DataSourceActivitiesParams = {}
  ): Promise<DataSourceActivityListResponseData> {
    const fetcher = useRequestFetch()

    // undefined値を除去したクエリパラメータを構築
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    )

    try {
      const response = await fetcher<DataSourceActivityListResponse>(
        `/api/data-sources/${dataSourceId}/activities`,
        {
          params: queryParams,
        }
      )

      return response.data
    } catch (error) {
      throw toHttpError(error)
    }
  }
}
