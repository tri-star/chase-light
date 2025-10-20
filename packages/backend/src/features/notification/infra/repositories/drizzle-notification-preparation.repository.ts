import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm"
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
  FindActivitiesForDigestParams,
  DigestActivity,
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

  async findActivitiesForDigest(
    params: FindActivitiesForDigestParams,
  ): Promise<DigestActivity[]> {
    const connection = await TransactionManager.getConnection()

    // ユーザーの監視設定とアクティビティを取得
    // データソース＋種別ごとに最大N件まで取得するため、window関数を使用
    const query = connection
      .select({
        activityId: activities.id,
        dataSourceId: sql<string>`${dataSources.id}`.as("data_source_id"),
        dataSourceName: dataSources.name,
        activityType: activities.activityType,
        title: activities.title,
        body: activities.body,
        url: sql<string>`COALESCE(${activities.githubData}::jsonb->>'html_url', '')`.as(
          "url",
        ),
        createdAt: activities.createdAt,
        rowNum:
          sql<number>`ROW_NUMBER() OVER (PARTITION BY ${dataSources.id}, ${activities.activityType} ORDER BY ${activities.createdAt} DESC)`.as(
            "row_num",
          ),
      })
      .from(activities)
      .innerJoin(dataSources, eq(activities.dataSourceId, dataSources.id))
      .innerJoin(
        userWatches,
        eq(userWatches.dataSourceId, activities.dataSourceId),
      )
      .where(
        and(
          eq(userWatches.userId, params.userId),
          eq(userWatches.notificationEnabled, true),
          eq(activities.status, ACTIVITY_STATUS.COMPLETED),
          gte(activities.createdAt, params.timeRange.from),
          lte(activities.createdAt, params.timeRange.to),
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
        ),
      )
      .as("ranked_activities")

    // window関数の結果から上位N件のみを取得
    const rows = await connection
      .select()
      .from(query)
      .where(lte(query.rowNum, params.maxActivitiesPerDataSourceAndType))
      .orderBy(
        asc(query.dataSourceId),
        asc(query.activityType),
        desc(query.createdAt),
      )

    return rows.map((row) => ({
      activityId: row.activityId,
      dataSourceId: row.dataSourceId,
      dataSourceName: row.dataSourceName,
      activityType: row.activityType,
      title: row.title,
      body: row.body,
      url: row.url,
      createdAt: row.createdAt,
    }))
  }
}
