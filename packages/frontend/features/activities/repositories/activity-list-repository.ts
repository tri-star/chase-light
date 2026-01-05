import type { ActivityListResponse } from '~/generated/api/schemas'
import { toHttpError } from '~/errors/http-error'
import type { ActivityListResponseData } from '../domain/activity-list'

export interface ActivityListParams {
  keyword?: string
  page?: number
  perPage?: number
}

export class ActivityListRepository {
  async fetch(
    params: ActivityListParams = {}
  ): Promise<ActivityListResponseData> {
    const fetcher = useRequestFetch()

    // undefined値を除去したクエリパラメータを構築
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    )

    try {
      const response = await fetcher<ActivityListResponse>('/api/activities', {
        params: queryParams,
      })

      return response.data
    } catch (error) {
      throw toHttpError(error)
    }
  }
}
