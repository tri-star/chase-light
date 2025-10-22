import { sql } from "drizzle-orm"
import { uuidv7 } from "uuidv7"
import { TransactionManager } from "../../../../core/db"
import { notificationDigestEntries, notifications } from "../../../../db/schema"
import type {
  CreateDigestNotificationsResult,
  DigestNotificationRepository,
} from "../../domain/repositories/digest-notification.repository"
import type { DigestNotificationDraft } from "../../domain/notification"

export class DrizzleDigestNotificationRepository
  implements DigestNotificationRepository
{
  async createMany(
    drafts: DigestNotificationDraft[],
  ): Promise<CreateDigestNotificationsResult> {
    if (drafts.length === 0) {
      return { created: 0, skippedByConflict: 0 }
    }

    const connection = await TransactionManager.getConnection()
    const now = new Date()

    const notificationValues = drafts.map((draft) => ({
      id: uuidv7(),
      userId: draft.notification.userId,
      activityId: draft.notification.activityId ?? null,
      title: draft.notification.title,
      message: draft.notification.message,
      notificationType: draft.notification.notificationType,
      isRead: false,
      sentAt: null,
      scheduledAt: draft.notification.scheduledAt,
      status: draft.notification.status,
      statusDetail: draft.notification.statusDetail ?? null,
      metadata: draft.notification.metadata,
      createdAt: now,
      updatedAt: now,
    }))

    const inserted = await connection
      .insert(notifications)
      .values(notificationValues)
      .onConflictDoNothing({
        target: notifications.id,
      })
      .returning({
        id: notifications.id,
      })

    const created = inserted.length
    const skippedByConflict = drafts.length - created

    if (created === 0) {
      return { created: 0, skippedByConflict: drafts.length }
    }

    const insertedIds = new Set(inserted.map((row) => row.id))
    const entryValues = notificationValues
      .filter((value) => insertedIds.has(value.id))
      .flatMap((value, index) => {
        const draft = drafts[index]
        return draft.entries.map((entry) => ({
          id: uuidv7(),
          notificationId: value.id,
          dataSourceId: entry.dataSourceId,
          dataSourceName: entry.dataSourceName,
          activityType: entry.activityType,
          activityId: entry.activityId,
          position: entry.position,
          title: entry.title,
          summary: entry.summary,
          url: entry.url,
          generator: entry.generator,
          createdAt: now,
          updatedAt: now,
        }))
      })

    if (entryValues.length > 0) {
      await connection
        .insert(notificationDigestEntries)
        .values(entryValues)
        .onConflictDoUpdate({
          target: [
            notificationDigestEntries.notificationId,
            notificationDigestEntries.dataSourceId,
            notificationDigestEntries.activityType,
            notificationDigestEntries.position,
          ],
          set: {
            title: sql`excluded.title`,
            summary: sql`excluded.summary`,
            url: sql`excluded.url`,
            generator: sql`excluded.generator`,
            updatedAt: sql`excluded.updated_at`,
          },
        })
    }

    return { created, skippedByConflict }
  }
}
