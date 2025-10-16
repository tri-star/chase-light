/**
 * Activity subscriber repository port
 */

import type { UserId, ActivityId } from "../notification"

export type UnprocessedActivity = {
  id: ActivityId
  dataSourceId: string
  activityType: string
  title: string
  body: string
  createdAt: Date
}

export interface ActivitySubscriberRepository {
  /**
   * Find users who are subscribing to the data source of the given activity
   * and have notifications enabled for the activity type
   *
   * @param activityId - Activity ID
   * @param activityType - Activity type (release, issue, pull_request)
   * @param dataSourceId - Data source ID
   * @returns Array of user IDs
   */
  findSubscribersByDataSource(
    activityId: ActivityId,
    activityType: string,
    dataSourceId: string,
  ): Promise<UserId[]>

  /**
   * Find activities that are completed and have not yet had notifications created
   *
   * @param limit - Maximum number of activities to return
   * @returns Array of unprocessed activities
   */
  findUnprocessedActivities(limit: number): Promise<UnprocessedActivity[]>

  /**
   * Find activities by IDs
   *
   * @param activityIds - Array of activity IDs
   * @returns Array of unprocessed activities
   */
  findActivitiesByIds(activityIds: ActivityId[]): Promise<UnprocessedActivity[]>
}
