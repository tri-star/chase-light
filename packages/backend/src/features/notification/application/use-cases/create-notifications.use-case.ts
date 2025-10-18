import type { NotificationRepository } from "../../domain/repositories/notification.repository"
import type { RecipientRepository } from "../../domain/repositories/recipient.repository"
import type { ActivitySubscriberRepository } from "../../domain/repositories/activity-subscriber.repository"
import {
  NOTIFICATION_STATUS,
  type UpsertNotificationInput,
  type ActivityId,
} from "../../domain/notification"
import { calculateNextNotificationTime } from "../../domain/notification-schedule"
import {
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_ERRORS,
  NOTIFICATION_MESSAGES,
} from "../../constants/notification.constants"

interface CreateNotificationsInputDto {
  activityIds?: ActivityId[]
  limit?: number
}

interface CreateNotificationsOutputDto {
  createdCount: number
  updatedCount: number
  failedActivityIds: ActivityId[]
}

/**
 * アクティビティから購読ユーザーを解決し、Notificationレコードを生成するユースケース
 */
export class CreateNotificationsUseCase {
  constructor(
    private notificationRepository: NotificationRepository,
    private recipientRepository: RecipientRepository,
    private activitySubscriberRepository: ActivitySubscriberRepository,
  ) {}

  /**
   * 未処理のアクティビティからNotificationレコードを生成
   */
  async execute(
    input: CreateNotificationsInputDto,
  ): Promise<CreateNotificationsOutputDto> {
    const limit = input.limit ?? NOTIFICATION_DEFAULTS.MAX_ACTIVITIES_PER_RUN

    // アクティビティの取得
    const activities = input.activityIds
      ? await this.activitySubscriberRepository.findActivitiesByIds(
          input.activityIds,
        )
      : await this.activitySubscriberRepository.findUnprocessedActivities(limit)

    if (activities.length === 0) {
      return { createdCount: 0, updatedCount: 0, failedActivityIds: [] }
    }

    const failedActivityIds: ActivityId[] = []
    const notificationInputs: UpsertNotificationInput[] = []

    // 各アクティビティに対して購読ユーザーを取得し、Notificationレコードを準備
    for (const activity of activities) {
      try {
        // 購読ユーザーの取得
        const subscriberIds =
          await this.activitySubscriberRepository.findSubscribersByDataSource(
            activity.id,
            activity.activityType,
            activity.dataSourceId,
          )

        if (subscriberIds.length === 0) {
          // 購読ユーザーがいない場合はスキップ（エラーではない）
          continue
        }

        // 受信者情報（通知設定含む）の取得
        const recipients =
          await this.recipientRepository.findMany(subscriberIds)

        if (recipients.length === 0) {
          throw new Error(NOTIFICATION_ERRORS.RECIPIENT_NOT_FOUND)
        }

        // 各受信者に対してNotificationレコードを生成
        for (const recipient of recipients) {
          const scheduledAt = calculateNextNotificationTime(
            recipient.digestNotificationTimes,
            recipient.timezone,
            new Date(),
          )

          const { title, message } = this.generateNotificationContent(
            activity.activityType,
            activity.title,
            activity.body,
          )

          notificationInputs.push({
            userId: recipient.id,
            activityId: activity.id,
            title,
            message,
            notificationType: NOTIFICATION_DEFAULTS.NOTIFICATION_TYPE,
            scheduledAt,
            status: NOTIFICATION_STATUS.PENDING,
            isRead: false,
          })
        }
      } catch (error) {
        console.error(
          `Failed to create notifications for activity ${activity.id}:`,
          error,
        )
        failedActivityIds.push(activity.id)
      }
    }

    // Notificationレコードを一括UPSERT
    if (notificationInputs.length === 0) {
      return { createdCount: 0, updatedCount: 0, failedActivityIds }
    }

    const results =
      await this.notificationRepository.upsertMany(notificationInputs)

    return {
      createdCount: results.length,
      updatedCount: 0, // UPSERTでは区別できないため0とする
      failedActivityIds,
    }
  }

  /**
   * アクティビティタイプに応じた通知内容を生成
   */
  private generateNotificationContent(
    activityType: string,
    title: string,
    body: string,
  ): { title: string; message: string } {
    // リポジトリ名を抽出（titleに含まれている想定）
    const repoName = this.extractRepoName(title)

    switch (activityType) {
      case "release": {
        const version = this.extractVersion(title)
        return {
          title: NOTIFICATION_MESSAGES.RELEASE_TITLE(repoName, version),
          message: NOTIFICATION_MESSAGES.RELEASE_MESSAGE(title, body),
        }
      }
      case "issue": {
        const issueNumber = this.extractIssueNumber(title)
        return {
          title: NOTIFICATION_MESSAGES.ISSUE_TITLE(repoName, issueNumber),
          message: NOTIFICATION_MESSAGES.ISSUE_MESSAGE(title, body),
        }
      }
      case "pull_request": {
        const prNumber = this.extractPRNumber(title)
        return {
          title: NOTIFICATION_MESSAGES.PULL_REQUEST_TITLE(repoName, prNumber),
          message: NOTIFICATION_MESSAGES.PULL_REQUEST_MESSAGE(title, body),
        }
      }
      default:
        return {
          title,
          message: body.substring(0, 500),
        }
    }
  }

  /**
   * タイトルからリポジトリ名を抽出
   */
  private extractRepoName(title: string): string {
    // 例: "owner/repo: Release v1.0.0" -> "owner/repo"
    const match = title.match(/^([^:]+)/)
    return match ? match[1].trim() : "Unknown"
  }

  /**
   * タイトルからバージョンを抽出
   */
  private extractVersion(title: string): string {
    // 例: "Release v1.0.0" -> "v1.0.0"
    const match = title.match(/v?\d+\.\d+\.\d+/)
    return match ? match[0] : "Unknown"
  }

  /**
   * タイトルからIssue番号を抽出
   */
  private extractIssueNumber(title: string): string {
    // 例: "Issue #123: Bug fix" -> "#123"
    const match = title.match(/#(\d+)/)
    return match ? `#${match[1]}` : "#Unknown"
  }

  /**
   * タイトルからPR番号を抽出
   */
  private extractPRNumber(title: string): string {
    // 例: "PR #456: Feature addition" -> "#456"
    const match = title.match(/#(\d+)/)
    return match ? `#${match[1]}` : "#Unknown"
  }
}
