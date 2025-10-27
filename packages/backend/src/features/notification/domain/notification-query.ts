import type { NotificationMetadata } from "./notification"
import type { NotificationReadFilter } from "../constants/query.constants"

export const NOTIFICATION_DIGEST_ACTIVITY_TYPE = {
  ISSUE: "issue",
  PULL_REQUEST: "pull_request",
  RELEASE: "release",
} as const

export type NotificationDigestActivityType =
  (typeof NOTIFICATION_DIGEST_ACTIVITY_TYPE)[keyof typeof NOTIFICATION_DIGEST_ACTIVITY_TYPE]

export type NotificationCursor = {
  lastActivityOccurredAt: Date
  notificationId: string
}

export type NotificationListQuery = {
  userId: string
  limit: number
  cursor?: NotificationCursor
  readFilter: NotificationReadFilter
  search?: string
}

export type NotificationDetailQuery = {
  userId: string
  notificationId: string
}

export type NotificationDigestEntrySummary = {
  activityId: string
  title: string
  summary: string
  occurredAt: Date
  url: string | null
  displayOrder: number
}

export type NotificationDigestGroupSummary = {
  activityType: NotificationDigestActivityType
  entries: NotificationDigestEntrySummary[]
}

export type NotificationRepositorySummary = {
  fullName: string | null
}

export type NotificationDataSourceSummary = {
  id: string
  name: string
  url: string
  sourceType: string
  repository?: NotificationRepositorySummary
  groups: NotificationDigestGroupSummary[]
}

export type NotificationSummary = {
  id: string
  type: string
  status: string
  isRead: boolean
  scheduledAt: Date
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
  lastActivityOccurredAt: Date
  metadata: NotificationMetadata | null
}

export type NotificationListItem = {
  notification: NotificationSummary
  dataSources: NotificationDataSourceSummary[]
}

export type NotificationListResult = {
  items: NotificationListItem[]
  pageInfo: {
    hasNext: boolean
    nextCursor?: NotificationCursor
  }
}
