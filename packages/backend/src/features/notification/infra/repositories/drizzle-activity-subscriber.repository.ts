import { eq, and, inArray, isNull, sql } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import { activities, userWatches, notifications } from "../../../../db/schema"
import type { UserId, ActivityId } from "../../domain/notification"
import { toUserId, toActivityId } from "../../domain/notification"
import type {
  ActivitySubscriberRepository,
  UnprocessedActivity,
} from "../../domain/repositories/activity-subscriber.repository"

/**
 * Activity subscriber repository implementation using Drizzle ORM
 */
export class DrizzleActivitySubscriberRepository
  implements ActivitySubscriberRepository
{
  /**
   * Find users who are subscribing to the data source of the given activity
   * and have notifications enabled for the activity type
   */
  async findSubscribersByDataSource(
    activityId: ActivityId,
    activityType: string,
    dataSourceId: string,
  ): Promise<UserId[]> {
    const connection = await TransactionManager.getConnection()

    // Get users who are watching this data source with notifications enabled
    // and watching the specific activity type
    const results = await connection
      .select({
        userId: userWatches.userId,
      })
      .from(userWatches)
      .where(
        and(
          eq(userWatches.dataSourceId, dataSourceId),
          eq(userWatches.notificationEnabled, true),
          this.getActivityTypeCondition(activityType),
        ),
      )

    return results.map((row) => toUserId(row.userId))
  }

  /**
   * Find activities that are completed and have not yet had notifications created
   */
  async findUnprocessedActivities(
    limit: number,
  ): Promise<UnprocessedActivity[]> {
    const connection = await TransactionManager.getConnection()

    // Find activities with status='completed' that don't have notifications yet
    const results = await connection
      .select({
        id: activities.id,
        dataSourceId: activities.dataSourceId,
        activityType: activities.activityType,
        title: activities.title,
        body: activities.body,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .leftJoin(notifications, eq(activities.id, notifications.activityId))
      .where(and(eq(activities.status, "completed"), isNull(notifications.id)))
      .limit(limit)

    return results.map(this.mapToUnprocessedActivity)
  }

  /**
   * Find activities by IDs
   */
  async findActivitiesByIds(
    activityIds: ActivityId[],
  ): Promise<UnprocessedActivity[]> {
    if (activityIds.length === 0) {
      return []
    }

    const connection = await TransactionManager.getConnection()

    const results = await connection
      .select({
        id: activities.id,
        dataSourceId: activities.dataSourceId,
        activityType: activities.activityType,
        title: activities.title,
        body: activities.body,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .where(inArray(activities.id, activityIds))

    return results.map(this.mapToUnprocessedActivity)
  }

  /**
   * Get the condition for activity type filtering based on user_watches
   */
  private getActivityTypeCondition(activityType: string) {
    switch (activityType) {
      case "release":
        return eq(userWatches.watchReleases, true)
      case "issue":
        return eq(userWatches.watchIssues, true)
      case "pull_request":
        return eq(userWatches.watchPullRequests, true)
      default:
        // If unknown type, return a condition that matches nothing
        return sql`false`
    }
  }

  /**
   * Map database result to UnprocessedActivity
   */
  private mapToUnprocessedActivity(row: {
    id: string
    dataSourceId: string
    activityType: string
    title: string
    body: string
    createdAt: Date
  }): UnprocessedActivity {
    return {
      id: toActivityId(row.id),
      dataSourceId: row.dataSourceId,
      activityType: row.activityType,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt,
    }
  }
}
