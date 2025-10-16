/**
 * Notification domain entities and types
 */

// Brand type for type-safe IDs
type Brand<K, T> = K & { __brand: T }

export type NotificationId = Brand<string, "NotificationId">
export type UserId = Brand<string, "UserId">
export type ActivityId = Brand<string, "ActivityId">

export const toNotificationId = (id: string): NotificationId =>
  id as NotificationId
export const toUserId = (id: string): UserId => id as UserId
export const toActivityId = (id: string): ActivityId => id as ActivityId

export const NOTIFICATION_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
} as const

export type NotificationStatus =
  (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS]

export const NOTIFICATION_TYPE = {
  IN_APP: "in_app",
  EMAIL: "email",
  DIGEST: "digest",
} as const

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]

export type Notification = {
  id: NotificationId
  userId: UserId
  activityId: ActivityId | null
  title: string
  message: string
  notificationType: NotificationType
  isRead: boolean
  scheduledAt: Date | null
  status: NotificationStatus
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CreateNotificationInput = {
  userId: UserId
  activityId: ActivityId
  title: string
  message: string
  notificationType: NotificationType
  scheduledAt: Date
  status: NotificationStatus
  isRead: boolean
}

export type UpsertNotificationInput = CreateNotificationInput & {
  id?: NotificationId
}
