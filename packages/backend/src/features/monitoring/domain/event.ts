/**
 * イベント関連の型定義・定数
 */

export const EVENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const
export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS]
export const isTerminalStatus = (status: EventStatus): boolean => {
  return status === EVENT_STATUS.COMPLETED || status === EVENT_STATUS.FAILED
}

export const EVENT_TYPE = {
  RELEASE: "release",
  ISSUE: "issue",
  PULL_REQUEST: "pull_request",
} as const
export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE]

export type Event = {
  id: string
  dataSourceId: string
  githubEventId: string
  eventType: EventType
  title: string
  body: string
  version: string | null
  status: EventStatus
  statusDetail: string | null
  githubData: string | null
  createdAt: Date
  updatedAt: Date
}
