import type { NotificationTarget } from "../notification-target"

export type FindNotificationTargetsParams = {
  limit: number
  activityIds?: string[]
}

/**
 * ダイジェスト通知用のアクティビティ情報
 */
export type DigestActivity = {
  activityId: string
  dataSourceId: string
  dataSourceName: string
  activityType: string
  title: string
  body: string
  url: string
  createdAt: Date
}

/**
 * ダイジェスト通知対象のアクティビティ取得パラメータ
 */
export type FindActivitiesForDigestParams = {
  userId: string
  timeRange: {
    from: Date
    to: Date
  }
  maxActivitiesPerDataSourceAndType: number
}

export interface NotificationPreparationRepository {
  findPendingTargets(
    params: FindNotificationTargetsParams,
  ): Promise<NotificationTarget[]>

  /**
   * ダイジェスト通知用のアクティビティを取得
   * ユーザー設定に基づき、データソース＋種別ごとに最大N件まで取得
   */
  findActivitiesForDigest(
    params: FindActivitiesForDigestParams,
  ): Promise<DigestActivity[]>
}
