/**
 * アクティビティ関連の型定義・定数
 */

// TODO: 後でpackages/shared/contracts配下に移動する
export const ACTIVITY_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const
export type ActivityStatus =
  (typeof ACTIVITY_STATUS)[keyof typeof ACTIVITY_STATUS]
export const isTerminalStatus = (status: ActivityStatus): boolean => {
  return (
    status === ACTIVITY_STATUS.COMPLETED || status === ACTIVITY_STATUS.FAILED
  )
}

export const ACTIVITY_TYPE = {
  RELEASE: "release",
  ISSUE: "issue",
  PULL_REQUEST: "pull_request",
} as const
export type ActivityType = (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE]

export type Activity = {
  id: string
  dataSourceId: string
  githubEventId: string
  activityType: ActivityType
  title: string
  body: string
  version: string | null
  status: ActivityStatus
  statusDetail: string | null
  githubData: string | null
  createdAt: Date
  updatedAt: Date
}
