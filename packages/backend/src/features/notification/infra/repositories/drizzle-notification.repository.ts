import { eq, and, sql } from "drizzle-orm"
import { randomUUID } from "crypto"
import { TransactionManager } from "../../../../core/db"
import { notifications } from "../../../../db/schema"
import type {
  Notification,
  NotificationId,
  UserId,
  ActivityId,
  UpsertNotificationInput,
} from "../../domain/notification"
import {
  toNotificationId,
  toUserId,
  toActivityId,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
} from "../../domain/notification"
import type { NotificationRepository } from "../../domain/repositories/notification.repository"

/**
 * Notification repository implementation using Drizzle ORM
 */
export class DrizzleNotificationRepository implements NotificationRepository {
  /**
   * Upsert a notification record
   * If a record with the same (userId, activityId) exists and status is 'pending', update it
   * If status is 'sent' or 'failed', do not update
   * Otherwise, insert a new record
   */
  async upsertNotification(
    input: UpsertNotificationInput,
  ): Promise<Notification> {
    const connection = await TransactionManager.getConnection()
    const now = new Date()
    const id = input.id || toNotificationId(randomUUID())

    const insertData = {
      id,
      userId: input.userId,
      activityId: input.activityId,
      title: input.title,
      message: input.message,
      notificationType: input.notificationType,
      isRead: input.isRead,
      scheduledAt: input.scheduledAt,
      status: input.status,
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    } as const

    const [result] = await connection
      .insert(notifications)
      .values(insertData)
      .onConflictDoUpdate({
        target: [notifications.userId, notifications.activityId],
        set: {
          title: sql`excluded.title`,
          message: sql`excluded.message`,
          notificationType: sql`excluded.notification_type`,
          scheduledAt: sql`excluded.scheduled_at`,
          updatedAt: sql`excluded.updated_at`,
        },
        where: eq(notifications.status, NOTIFICATION_STATUS.PENDING),
      })
      .returning()

    return this.mapToDomain(result)
  }

  /**
   * Upsert multiple notification records in a single transaction
   */
  async upsertMany(inputs: UpsertNotificationInput[]): Promise<Notification[]> {
    if (inputs.length === 0) {
      return []
    }

    const connection = await TransactionManager.getConnection()
    const now = new Date()

    const insertDataList = inputs.map((input) => ({
      id: input.id || toNotificationId(randomUUID()),
      userId: input.userId,
      activityId: input.activityId,
      title: input.title,
      message: input.message,
      notificationType: input.notificationType,
      isRead: input.isRead,
      scheduledAt: input.scheduledAt,
      status: input.status,
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    }))

    const results = await connection
      .insert(notifications)
      .values(insertDataList)
      .onConflictDoUpdate({
        target: [notifications.userId, notifications.activityId],
        set: {
          title: sql`excluded.title`,
          message: sql`excluded.message`,
          notificationType: sql`excluded.notification_type`,
          scheduledAt: sql`excluded.scheduled_at`,
          updatedAt: sql`excluded.updated_at`,
        },
        where: eq(notifications.status, NOTIFICATION_STATUS.PENDING),
      })
      .returning()

    return results.map(this.mapToDomain)
  }

  /**
   * Find a notification by user ID and activity ID
   */
  async findByUserAndActivity(
    userId: UserId,
    activityId: ActivityId,
  ): Promise<Notification | null> {
    const connection = await TransactionManager.getConnection()

    const results = await connection
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.activityId, activityId),
        ),
      )
      .limit(1)

    return results.length > 0 ? this.mapToDomain(results[0]) : null
  }

  /**
   * Find a notification by ID
   */
  async findById(id: NotificationId): Promise<Notification | null> {
    const connection = await TransactionManager.getConnection()

    const results = await connection
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1)

    return results.length > 0 ? this.mapToDomain(results[0]) : null
  }

  /**
   * Map database result to domain entity
   */
  private mapToDomain(row: typeof notifications.$inferSelect): Notification {
    return {
      id: toNotificationId(row.id),
      userId: toUserId(row.userId),
      activityId: row.activityId ? toActivityId(row.activityId) : null,
      title: row.title,
      message: row.message,
      notificationType:
        row.notificationType as (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE],
      isRead: row.isRead,
      scheduledAt: row.scheduledAt,
      status:
        row.status as (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS],
      sentAt: row.sentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
