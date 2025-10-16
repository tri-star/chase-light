import {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  type NotificationDraft,
} from "../../domain"
import { resolveRecipientDigestSettings } from "../../domain/recipient"
import type {
  FindNotificationTargetsParams,
  NotificationPreparationRepository,
} from "../../domain/repositories/notification-preparation.repository"
import type { NotificationRepository } from "../../domain/repositories/notification.repository"
import { calculateNextDigestSchedule } from "../services/notification-schedule.service"

export type GenerateDigestNotificationsInput = Partial<
  Omit<FindNotificationTargetsParams, "limit">
> & {
  limit?: number
  dryRun?: boolean
}

export type GenerateDigestNotificationsResult = {
  created: number
  skippedByConflict: number
  totalExamined: number
  lastProcessedActivityId: string | null
}

const DEFAULT_LIMIT = 200

export class GenerateDigestNotificationsUseCase {
  constructor(
    private readonly notificationPreparationRepository: NotificationPreparationRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: GenerateDigestNotificationsInput = {},
  ): Promise<GenerateDigestNotificationsResult> {
    const limit = input.limit ?? DEFAULT_LIMIT
    const targets =
      await this.notificationPreparationRepository.findPendingTargets({
        limit,
        activityIds: input.activityIds,
      })

    if (targets.length === 0) {
      return {
        created: 0,
        skippedByConflict: 0,
        totalExamined: 0,
        lastProcessedActivityId: null,
      }
    }

    const drafts: NotificationDraft[] = []

    for (const target of targets) {
      const resolved = resolveRecipientDigestSettings(target.recipient)
      if (!resolved.enabled) {
        continue
      }

      const schedule = calculateNextDigestSchedule({
        recipient: target.recipient,
        activityCreatedAt: target.activity.createdAt,
        now: this.now(),
      })

      drafts.push({
        activityId: target.activity.id,
        userId: target.recipient.id,
        title: `ダイジェスト通知: ${target.activity.dataSourceName}`,
        message: `${target.activity.dataSourceName} に ${target.activity.type} の更新があります`,
        notificationType: NOTIFICATION_TYPE.ACTIVITY_DIGEST,
        scheduledAt: schedule.scheduledAt,
        status: NOTIFICATION_STATUS.PENDING,
        statusDetail: null,
        metadata: {
          activityType: target.activity.type,
          dataSourceId: target.activity.dataSourceId,
          dataSourceName: target.activity.dataSourceName,
          scheduledSlot: schedule.scheduledSlot,
          digestTimezone: schedule.timezone,
        },
      })
    }

    const lastProcessedActivityId =
      targets[targets.length - 1]?.activity.id ?? null

    if (input.dryRun || drafts.length === 0) {
      return {
        created: 0,
        skippedByConflict: 0,
        totalExamined: targets.length,
        lastProcessedActivityId,
      }
    }

    const result = await this.notificationRepository.createMany(drafts)

    return {
      created: result.created,
      skippedByConflict: result.skippedByConflict,
      totalExamined: targets.length,
      lastProcessedActivityId,
    }
  }
}
