import type { ActivityDetailResponse } from '~/generated/api/schemas'
import type { ActivityDetail } from '../domain/activity'

export class ActivityDetailRepository {
  async fetch(activityId: string): Promise<ActivityDetail> {
    const requestFetch = useRequestFetch()
    const response = await requestFetch<ActivityDetailResponse>(
      `/api/activities/${activityId}`
    )

    // 差分整形が必要になった場合はここで map する。
    return response.data.activity
  }
}
