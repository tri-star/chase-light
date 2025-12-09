import type { DataSourceDetailResponse } from '~/generated/api/schemas'
import { toHttpError } from '~/errors/http-error'
import type { DataSourceDetail } from '../domain/data-source-detail'

export class DataSourceDetailRepository {
  async fetch(id: string): Promise<DataSourceDetail> {
    const fetcher = useRequestFetch()

    try {
      const response = await fetcher<DataSourceDetailResponse>(
        `/api/data-sources/${id}`
      )

      return response.data
    } catch (error) {
      throw toHttpError(error)
    }
  }
}
