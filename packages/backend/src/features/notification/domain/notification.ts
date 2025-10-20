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
  activityType: string
  dataSourceId: string
  dataSourceName: string
  scheduledSlot: string
  digestTimezone: string
}

export type NotificationDraft = {
  activityId: string
  userId: string
  title: string
  message: string
  notificationType: NotificationType
  scheduledAt: Date
  status: NotificationStatus
  statusDetail?: string | null
  metadata: NotificationMetadata
}
