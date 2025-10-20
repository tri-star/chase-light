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

import type { DigestActivitySummary } from "./digest-activity-summary"

export interface NotificationMetadata extends Record<string, unknown> {
  activityType?: string
  dataSourceId?: string
  dataSourceName?: string
  scheduledSlot: string
  digestTimezone: string
  digest?: DigestActivitySummary // 構造化されたダイジェスト情報
}

export type NotificationDraft = {
  activityId?: string // nullable for digest notifications
  userId: string
  title: string
  message: string
  notificationType: NotificationType
  scheduledAt: Date
  status: NotificationStatus
  statusDetail?: string | null
  metadata: NotificationMetadata
  activityIds?: string[] // 関連するアクティビティIDの配列（ダイジェスト通知用）
}
