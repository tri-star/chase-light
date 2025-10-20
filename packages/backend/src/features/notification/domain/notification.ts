import type { DigestGeneratorType, NotificationDigestMetadata } from "./digest"

export const NOTIFICATION_STATUS = {
  PENDING: "pending",
  QUEUED: "queued",
  SENT: "sent",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const

export type NotificationStatus =
  (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS]

export const NOTIFICATION_TYPE = {
  ACTIVITY_DIGEST: "activity_digest",
} as const

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]

export interface NotificationMetadata extends Record<string, unknown> {
  digest?: NotificationDigestMetadata
}

export type NotificationDraft = {
  userId: string
  title: string
  message: string
  notificationType: NotificationType
  scheduledAt: Date
  status: NotificationStatus
  statusDetail?: string | null
  metadata: NotificationMetadata
  activityId?: string | null
}

export type DigestNotificationEntryDraft = {
  dataSourceId: string
  dataSourceName: string
  activityType: string
  activityId: string
  position: number
  title: string
  summary: string
  url: string | null
  generator: DigestGeneratorType
}

export type DigestNotificationDraft = {
  notification: NotificationDraft
  entries: DigestNotificationEntryDraft[]
}
