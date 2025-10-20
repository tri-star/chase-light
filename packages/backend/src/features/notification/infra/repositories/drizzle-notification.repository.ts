import { randomUUID } from "node:crypto"
import { TransactionManager } from "../../../../core/db"
import { notifications, notificationActivities } from "../../../../db/schema"
import type {
  CreateNotificationsResult,
  NotificationRepository,
} from "../../domain/repositories/notification.repository"
import type { NotificationDraft } from "../../domain"

export class DrizzleNotificationRepository implements NotificationRepository {
  async createMany(
    drafts: NotificationDraft[],
  ): Promise<CreateNotificationsResult> {
    if (drafts.length === 0) {
      return { created: 0, skippedByConflict: 0 }
    }

    const connection = await TransactionManager.getConnection()
    const now = new Date()
    const values = drafts.map((draft) => ({
      id: randomUUID(),
      userId: draft.userId,
      activityId: draft.activityId ?? null,
      title: draft.title,
      message: draft.message,
      notificationType: draft.notificationType,
      isRead: false,
      sentAt: null,
      scheduledAt: draft.scheduledAt,
      status: draft.status,
      statusDetail: draft.statusDetail ?? null,
      metadata: draft.metadata,
      createdAt: now,
      updatedAt: now,
    }))

    const inserted = await connection
      .insert(notifications)
      .values(values)
      .returning({ id: notifications.id })

    // ダイジェスト通知の場合、notification_activities に関連を保存
    const notificationActivitiesValues = []
    for (let i = 0; i < inserted.length; i++) {
      const draft = drafts[i]
      const notificationId = inserted[i].id
      if (draft.activityIds && draft.activityIds.length > 0) {
        for (const activityId of draft.activityIds) {
          notificationActivitiesValues.push({
            notificationId,
            activityId,
            createdAt: now,
          })
        }
      }
    }

    if (notificationActivitiesValues.length > 0) {
      await connection
        .insert(notificationActivities)
        .values(notificationActivitiesValues)
    }

    const created = inserted.length
    const skippedByConflict = drafts.length - created

    return { created, skippedByConflict }
  }
}
