import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm"
import { TransactionManager } from "../../../../core/db"
import {
  activities,
  dataSources,
  notificationDigestEntries,
  notifications,
  repositories,
} from "../../../../db/schema"
import {
  NOTIFICATIONS_READ_FILTER,
  type NotificationReadFilter,
} from "../../constants/query.constants"
import type {
  NotificationCursor,
  NotificationDataSourceSummary,
  NotificationDigestActivityType,
  NotificationDigestGroupSummary,
  NotificationDigestEntrySummary,
  NotificationDetailQuery,
  NotificationListItem,
  NotificationListQuery,
  NotificationListResult,
  NotificationSummary,
} from "../../domain/notification-query"
import type { NotificationQueryRepository } from "../../domain/repositories/notification-query.repository"
import type { NotificationMetadata } from "../../domain/notification"

type NotificationBaseRow = {
  notificationId: string
  notificationType: string
  notificationStatus: string
  notificationIsRead: boolean
  notificationScheduledAt: Date
  notificationSentAt: Date | null
  notificationCreatedAt: Date
  notificationUpdatedAt: Date
  notificationMetadata: NotificationMetadata | null
  lastActivityOccurredAt: Date
}

type NotificationDetailRow = {
  notificationId: string
  dataSourceId: string
  dataSourceName: string
  dataSourceUrl: string
  dataSourceSourceType: string
  repositoryFullName: string | null
  digestActivityType: NotificationDigestActivityType
  digestActivityId: string
  digestTitle: string
  digestSummary: string
  digestUrl: string | null
  digestPosition: number
  activityOccurredAt: Date | null
}

export class DrizzleNotificationQueryRepository
  implements NotificationQueryRepository
{
  async list(query: NotificationListQuery): Promise<NotificationListResult> {
    const connection = await TransactionManager.getConnection()

    const baseRows = await this.fetchBaseRows(connection, {
      userId: query.userId,
      readFilter: query.readFilter,
      search: query.search,
      cursor: query.cursor,
      limit: query.limit + 1,
    })

    const hasNext = baseRows.length > query.limit
    const paginatedRows = hasNext ? baseRows.slice(0, query.limit) : baseRows

    const notificationIds = paginatedRows.map((row) => row.notificationId)
    if (notificationIds.length === 0) {
      return {
        items: [],
        pageInfo: {
          hasNext: false,
        },
      }
    }

    const detailRows = await this.fetchDetailRows(connection, notificationIds)
    const items = this.buildItems(paginatedRows, detailRows)

    const nextCursorSource = hasNext
      ? paginatedRows[paginatedRows.length - 1]
      : undefined

    return {
      items,
      pageInfo: {
        hasNext,
        ...(hasNext && nextCursorSource
          ? {
              nextCursor: {
                lastActivityOccurredAt: nextCursorSource.lastActivityOccurredAt,
                notificationId: nextCursorSource.notificationId,
              } satisfies NotificationCursor,
            }
          : {}),
      },
    }
  }

  async findById(
    query: NotificationDetailQuery,
  ): Promise<NotificationListItem | null> {
    const connection = await TransactionManager.getConnection()

    const baseRows = await this.fetchBaseRows(connection, {
      userId: query.userId,
      notificationId: query.notificationId,
      limit: 1,
    })

    if (baseRows.length === 0) {
      return null
    }

    const detailRows = await this.fetchDetailRows(connection, [
      query.notificationId,
    ])
    const [item] = this.buildItems(baseRows, detailRows)
    return item ?? null
  }

  private async fetchBaseRows(
    connection: Awaited<ReturnType<typeof TransactionManager.getConnection>>,
    params: {
      userId: string
      readFilter?: NotificationReadFilter
      search?: string
      cursor?: NotificationCursor
      notificationId?: string
      limit: number
    },
  ): Promise<NotificationBaseRow[]> {
    const lastActivityExpr = sql<Date>`
      COALESCE(
        MAX(${activities.createdAt}),
        ${notifications.scheduledAt}
      )
    `.as("last_activity_occurred_at")

    const selectFields = {
      notificationId: notifications.id,
      notificationType: notifications.notificationType,
      notificationStatus: notifications.status,
      notificationIsRead: notifications.isRead,
      notificationScheduledAt: notifications.scheduledAt,
      notificationSentAt: notifications.sentAt,
      notificationCreatedAt: notifications.createdAt,
      notificationUpdatedAt: notifications.updatedAt,
      notificationMetadata: notifications.metadata,
      lastActivityOccurredAt: lastActivityExpr,
    }

    let baseQuery = connection
      .select(selectFields)
      .from(notifications)
      .leftJoin(
        notificationDigestEntries,
        eq(notificationDigestEntries.notificationId, notifications.id),
      )
      .leftJoin(
        activities,
        eq(notificationDigestEntries.activityId, activities.id),
      )
      .$dynamic()

    const conditions: SQL[] = [eq(notifications.userId, params.userId)]

    if (params.notificationId) {
      conditions.push(eq(notifications.id, params.notificationId))
    }

    if (params.readFilter === NOTIFICATIONS_READ_FILTER.READ) {
      conditions.push(eq(notifications.isRead, true))
    } else if (params.readFilter === NOTIFICATIONS_READ_FILTER.UNREAD) {
      conditions.push(eq(notifications.isRead, false))
    }

    if (params.search) {
      const pattern = `%${params.search}%`
      const searchCondition = or(
        ilike(notificationDigestEntries.title, pattern),
        ilike(notificationDigestEntries.summary, pattern),
        ilike(activities.translatedTitle, pattern),
        ilike(activities.summary, pattern),
        ilike(activities.translatedBody, pattern),
      )

      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions))
    }

    baseQuery = baseQuery.groupBy(
      notifications.id,
      notifications.notificationType,
      notifications.status,
      notifications.isRead,
      notifications.scheduledAt,
      notifications.sentAt,
      notifications.createdAt,
      notifications.updatedAt,
      notifications.metadata,
    )

    const notificationBase = baseQuery.as("notification_base")

    let paginatedQuery = connection
      .select({
        notificationId: notificationBase.notificationId,
        notificationType: notificationBase.notificationType,
        notificationStatus: notificationBase.notificationStatus,
        notificationIsRead: notificationBase.notificationIsRead,
        notificationScheduledAt: notificationBase.notificationScheduledAt,
        notificationSentAt: notificationBase.notificationSentAt,
        notificationCreatedAt: notificationBase.notificationCreatedAt,
        notificationUpdatedAt: notificationBase.notificationUpdatedAt,
        notificationMetadata: notificationBase.notificationMetadata,
        lastActivityOccurredAt: notificationBase.lastActivityOccurredAt,
      })
      .from(notificationBase)
      .$dynamic()

    if (params.cursor) {
      paginatedQuery = paginatedQuery.where(
        or(
          lt(
            notificationBase.lastActivityOccurredAt,
            params.cursor.lastActivityOccurredAt,
          ),
          and(
            eq(
              notificationBase.lastActivityOccurredAt,
              params.cursor.lastActivityOccurredAt,
            ),
            lt(notificationBase.notificationId, params.cursor.notificationId),
          ),
        ),
      )
    }

    paginatedQuery = paginatedQuery
      .orderBy(
        desc(notificationBase.lastActivityOccurredAt),
        desc(notificationBase.notificationId),
      )
      .limit(params.limit)

    const rows = await paginatedQuery

    return rows.map((row) => ({
      ...row,
      notificationScheduledAt: new Date(row.notificationScheduledAt),
      notificationSentAt: row.notificationSentAt
        ? new Date(row.notificationSentAt)
        : null,
      notificationCreatedAt: new Date(row.notificationCreatedAt),
      notificationUpdatedAt: new Date(row.notificationUpdatedAt),
      lastActivityOccurredAt: new Date(row.lastActivityOccurredAt),
    }))
  }

  private async fetchDetailRows(
    connection: Awaited<ReturnType<typeof TransactionManager.getConnection>>,
    notificationIds: string[],
  ): Promise<NotificationDetailRow[]> {
    if (notificationIds.length === 0) {
      return []
    }

    const rows = await connection
      .select({
        notificationId: notifications.id,
        dataSourceId: dataSources.id,
        dataSourceName: dataSources.name,
        dataSourceUrl: dataSources.url,
        dataSourceSourceType: dataSources.sourceType,
        repositoryFullName: repositories.fullName,
        digestActivityType: notificationDigestEntries.activityType,
        digestActivityId: notificationDigestEntries.activityId,
        digestTitle: notificationDigestEntries.title,
        digestSummary: notificationDigestEntries.summary,
        digestUrl: notificationDigestEntries.url,
        digestPosition: notificationDigestEntries.position,
        activityOccurredAt: activities.createdAt,
      })
      .from(notifications)
      .innerJoin(
        notificationDigestEntries,
        eq(notificationDigestEntries.notificationId, notifications.id),
      )
      .innerJoin(
        dataSources,
        eq(notificationDigestEntries.dataSourceId, dataSources.id),
      )
      .leftJoin(repositories, eq(repositories.dataSourceId, dataSources.id))
      .leftJoin(
        activities,
        eq(notificationDigestEntries.activityId, activities.id),
      )
      .where(inArray(notifications.id, notificationIds))
      .orderBy(
        notifications.id,
        dataSources.id,
        notificationDigestEntries.activityType,
        notificationDigestEntries.position,
      )

    return rows.map((row) => ({
      ...row,
      digestActivityType:
        row.digestActivityType as NotificationDigestActivityType,
    }))
  }

  private buildItems(
    baseRows: NotificationBaseRow[],
    detailRows: NotificationDetailRow[],
  ): NotificationListItem[] {
    const itemMap = new Map<
      string,
      {
        item: NotificationListItem
        dataSourceMap: Map<
          string,
          {
            summary: NotificationDataSourceSummary
            groupMap: Map<string, NotificationDigestGroupSummary>
          }
        >
      }
    >()

    for (const row of baseRows) {
      const summary: NotificationSummary = {
        id: row.notificationId,
        type: row.notificationType,
        status: row.notificationStatus,
        isRead: row.notificationIsRead,
        scheduledAt: row.notificationScheduledAt,
        sentAt: row.notificationSentAt,
        createdAt: row.notificationCreatedAt,
        updatedAt: row.notificationUpdatedAt,
        lastActivityOccurredAt: row.lastActivityOccurredAt,
        metadata: row.notificationMetadata ?? null,
      }

      const item: NotificationListItem = {
        notification: summary,
        dataSources: [],
      }

      itemMap.set(row.notificationId, {
        item,
        dataSourceMap: new Map(),
      })
    }

    for (const row of detailRows) {
      const cached = itemMap.get(row.notificationId)
      if (!cached) {
        continue
      }

      let dataSourceEntry = cached.dataSourceMap.get(row.dataSourceId)
      if (!dataSourceEntry) {
        const dataSourceSummary: NotificationDataSourceSummary = {
          id: row.dataSourceId,
          name: row.dataSourceName,
          url: row.dataSourceUrl,
          sourceType: row.dataSourceSourceType,
          ...(row.repositoryFullName
            ? { repository: { fullName: row.repositoryFullName } }
            : {}),
          groups: [],
        }

        dataSourceEntry = {
          summary: dataSourceSummary,
          groupMap: new Map(),
        }

        cached.dataSourceMap.set(row.dataSourceId, dataSourceEntry)
        cached.item.dataSources.push(dataSourceSummary)
      }

      const groupKey = row.digestActivityType
      let group = dataSourceEntry.groupMap.get(groupKey)
      if (!group) {
        const newGroup: NotificationDigestGroupSummary = {
          activityType: row.digestActivityType,
          entries: [],
        }
        dataSourceEntry.groupMap.set(groupKey, newGroup)
        dataSourceEntry.summary.groups.push(newGroup)
        group = newGroup
      }

      const entry: NotificationDigestEntrySummary = {
        activityId: row.digestActivityId,
        title: row.digestTitle,
        summary: row.digestSummary,
        occurredAt:
          row.activityOccurredAt ??
          cached.item.notification.lastActivityOccurredAt,
        url: row.digestUrl,
        displayOrder: row.digestPosition,
      }

      group.entries.push(entry)
    }

    return baseRows.map((row) => itemMap.get(row.notificationId)!.item)
  }
}
