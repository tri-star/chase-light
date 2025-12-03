import type { DataSourceListResponse } from '~/generated/api/schemas'
import { toHttpError } from '~/errors/http-error'
import type {
  DataSourceListResponseData,
  DataSourceSortBy,
  DataSourceSortOrder,
} from '../domain/data-source'

export interface DataSourceListParams {
  search?: string
  sortBy?: DataSourceSortBy
  sortOrder?: DataSourceSortOrder
  page?: number
  perPage?: number
}

export class DataSourceListRepository {
  async fetch(
    params: DataSourceListParams = {}
  ): Promise<DataSourceListResponseData> {
    const fetcher = useRequestFetch()

    // undefined値を除去したクエリパラメータを構築
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    )

    try {
      const response = await fetcher<DataSourceListResponse>(
        '/api/data-sources',
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
