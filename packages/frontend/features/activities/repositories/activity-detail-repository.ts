import type { ActivityDetailResponse } from '~/generated/api/schemas'
import { toHttpError } from '~/errors/http-error'
import type { ActivityDetail } from '../domain/activity'

export class ActivityDetailRepository {
  async fetch(activityId: string): Promise<ActivityDetail> {
    const fetcher = useRequestFetch()
    try {
      const response = await fetcher<ActivityDetailResponse>(
        `/api/activities/${activityId}`
      )

      // 差分整形が必要になった場合はここで map する。
      return response.data.activity
    } catch (error) {
      throw toHttpError(error)
    }
  }
}
