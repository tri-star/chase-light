import { and, asc, eq, inArray, isNull, or } from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import {
  activities,
  dataSources,
  notifications,
  userPreferences,
  userWatches,
  users,
} from "../../../../db/schema"
import { ACTIVITY_STATUS } from "../../../activities/domain"
import type {
  FindNotificationTargetsParams,
  NotificationPreparationRepository,
} from "../../domain/repositories/notification-preparation.repository"
import type { NotificationTarget } from "../../domain"

export class DrizzleNotificationPreparationRepository
  implements NotificationPreparationRepository
{
  async findPendingTargets(
    params: FindNotificationTargetsParams,
  ): Promise<NotificationTarget[]> {
    const connection = await TransactionManager.getConnection()
    const conditions = [
      eq(activities.status, ACTIVITY_STATUS.COMPLETED),
      eq(userWatches.notificationEnabled, true),
      or(
        and(
          eq(activities.activityType, "release"),
          eq(userWatches.watchReleases, true),
        ),
        and(
          eq(activities.activityType, "issue"),
          eq(userWatches.watchIssues, true),
        ),
        and(
          eq(activities.activityType, "pull_request"),
          eq(userWatches.watchPullRequests, true),
        ),
      ),
      or(
        isNull(userPreferences.digestEnabled),
        eq(userPreferences.digestEnabled, true),
      ),
      isNull(notifications.id),
    ]

    if (params.activityIds && params.activityIds.length > 0) {
      conditions.push(inArray(activities.id, params.activityIds))
    }

    const rows = await connection
      .select({
        activityId: activities.id,
        activityType: activities.activityType,
        activityCreatedAt: activities.createdAt,
        activityTitle: activities.title,
        dataSourceId: dataSources.id,
        dataSourceName: dataSources.name,
        dataSourceSourceId: dataSources.sourceId,
        userId: users.id,
        userTimezone: users.timezone,
        digestEnabled: userPreferences.digestEnabled,
        digestTimes: userPreferences.digestDeliveryTimes,
        digestTimezone: userPreferences.digestTimezone,
      })
      .from(activities)
      .innerJoin(dataSources, eq(activities.dataSourceId, dataSources.id))
      .innerJoin(
        userWatches,
        eq(userWatches.dataSourceId, activities.dataSourceId),
      )
      .innerJoin(users, eq(users.id, userWatches.userId))
      .leftJoin(userPreferences, eq(userPreferences.userId, users.id))
      .leftJoin(
        notifications,
        and(
          eq(notifications.activityId, activities.id),
          eq(notifications.userId, users.id),
        ),
      )
      .where(and(...conditions))
      .orderBy(asc(activities.createdAt), asc(users.id))
      .limit(params.limit)

    return rows.map((row) => {
      const dataSourceLabel =
        row.dataSourceName ?? row.dataSourceSourceId ?? "unknown"
      return {
        activity: {
          id: row.activityId,
          type: row.activityType,
          createdAt: row.activityCreatedAt,
          dataSourceId: row.dataSourceId,
          dataSourceName: dataSourceLabel,
          title: row.activityTitle,
        },
        recipient: {
          id: row.userId,
          timezone: row.userTimezone,
          digest: {
            enabled: row.digestEnabled ?? true,
            times: row.digestTimes ?? [],
            timezone: row.digestTimezone ?? row.userTimezone,
          },
          channels: ["digest"],
        },
      }
    })
  }
}
