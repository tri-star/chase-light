import { DIGEST_PLACEHOLDER_MESSAGE } from "shared"

export const DIGEST_GENERATOR_TYPE = {
  AI: "ai",
  FALLBACK: "fallback",
} as const

export type DigestGeneratorType =
  (typeof DIGEST_GENERATOR_TYPE)[keyof typeof DIGEST_GENERATOR_TYPE]

export type DigestGroupId = string

export type DigestWindow = {
  from: Date
  to: Date
  timezone: string
}

export type DigestEntryCandidate = {
  activityId: string
  activityType: string
  occurredAt: Date
  title: string
  body: string | null
  url: string | null
  dataSourceId: string
  dataSourceName: string
}

export type DigestGroupCandidate = {
  id: DigestGroupId
  dataSourceId: string
  dataSourceName: string
  activityType: string
  entries: DigestEntryCandidate[]
}

export type DigestCandidate = {
  userId: string
  userTimezone: string
  window: DigestWindow
  totalActivities: number
  groups: DigestGroupCandidate[]
}

export type DigestGeneratedEntry = {
  activityId: string
  position: number
  title: string
  summary: string
  url: string | null
  generator: DigestGeneratorType
}

export type DigestGeneratorStats = {
  groupId: DigestGroupId
  type: DigestGeneratorType
  model?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export type DigestGroupResult = {
  id: DigestGroupId
  dataSourceId: string
  dataSourceName: string
  activityType: string
  entries: DigestGeneratedEntry[]
  generator: DigestGeneratorStats
}

export type NotificationDigestGroupMetadata = {
  groupId: DigestGroupId
  dataSourceId: string
  dataSourceName: string
  activityType: string
  activityIds: string[]
}

export type NotificationDigestMetadata = {
  range: {
    from: string
    to: string
    timezone: string
  }
  activityCount: number
  groups: NotificationDigestGroupMetadata[]
  generatorStats: DigestGeneratorStats[]
  messagePlaceholder: string
}

export const DIGEST_NOTIFICATION_MESSAGE_PLACEHOLDER =
  DIGEST_PLACEHOLDER_MESSAGE

export function createDigestGroupId(
  dataSourceId: string,
  activityType: string,
): DigestGroupId {
  return `${dataSourceId}:${activityType}`
}
