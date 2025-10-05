/**
 * アクティビティ参照用のドメイン型定義
 *
 * features/detection とは異なり、参照（読み取り）に特化した型定義
 */

import type { Brand } from "../../../shared/types/brand"

/**
 * ActivityId のブランド型
 */
export type ActivityId = Brand<string, "ActivityId">

export const toActivityId = (id: string): ActivityId => id as ActivityId

/**
 * アクティビティタイプ
 * detection フィーチャーと共通の定義を使用
 */
export const ACTIVITY_TYPE = {
  RELEASE: "release",
  ISSUE: "issue",
  PULL_REQUEST: "pull_request",
} as const

export type ActivityType = (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE]

/**
 * アクティビティステータス
 * detection フィーチャーと共通の定義を使用
 */
export const ACTIVITY_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const

export type ActivityStatus =
  (typeof ACTIVITY_STATUS)[keyof typeof ACTIVITY_STATUS]

/**
 * アクティビティエンティティ（参照用）
 */
export type Activity = {
  id: ActivityId
  dataSourceId: string
  activityType: ActivityType
  title: string
  body: string
  version: string | null
  status: ActivityStatus
  statusDetail: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * データソース情報
 */
export type DataSourceInfo = {
  id: string
  name: string
  description: string
  url: string
}

/**
 * データソース情報を含むアクティビティ（一覧取得用）
 */
export type ActivityWithDataSource = Activity & {
  dataSource: {
    id: string
    name: string
    url: string
  }
}

/**
 * データソース詳細情報を含むアクティビティ（詳細取得用）
 */
export type ActivityDetail = Activity & {
  dataSource: DataSourceInfo
}
