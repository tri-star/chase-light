import { randomUUID } from "node:crypto"
import { TransactionManager } from "../../../../core/db"
import { notifications } from "../../../../db/schema"
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
      activityId: draft.activityId,
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
      .onConflictDoNothing({
        target: [notifications.userId, notifications.activityId],
      })
      .returning({ id: notifications.id })

    const created = inserted.length
    const skippedByConflict = drafts.length - created

    return { created, skippedByConflict }
  }
}
