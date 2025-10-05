/**
 * アクティビティリポジトリのインターフェース定義
 *
 * アクティビティの参照（読み取り）操作を定義
 */

import type {
  ActivityId,
  ActivityType,
  ActivityStatus,
  ActivityWithDataSource,
  ActivityDetail,
} from "../activity"

/**
 * フィルタリング条件
 */
export type ActivityFilterInput = {
  activityType?: ActivityType
  status?: ActivityStatus
  createdAfter?: Date
  createdBefore?: Date
  updatedAfter?: Date
  updatedBefore?: Date
}

/**
 * ページネーション入力
 */
export type PaginationInput = {
  page: number
  perPage: number
}

/**
 * ソート入力
 */
export type SortInput = {
  sortBy: "createdAt" | "updatedAt"
  sortOrder: "asc" | "desc"
}

/**
 * アクティビティ一覧取得の入力
 */
export type FindActivitiesInput = {
  userId: string
  filter?: ActivityFilterInput
  pagination: PaginationInput
  sort: SortInput
}

/**
 * データソース別アクティビティ一覧取得の入力
 */
export type FindByDataSourceInput = {
  userId: string
  dataSourceId: string
  filter?: ActivityFilterInput
  pagination: PaginationInput
  sort: SortInput
}

/**
 * アクティビティリポジトリインターフェース
 */
export interface ActivityRepository {
  /**
   * ユーザーに関連するアクティビティ一覧を取得
   * ユーザーが監視中のデータソースに関連するアクティビティのみ取得
   */
  findByUserId(input: FindActivitiesInput): Promise<ActivityWithDataSource[]>

  /**
   * ユーザーに関連するアクティビティの総件数を取得
   */
  countByUserId(userId: string, filter?: ActivityFilterInput): Promise<number>

  /**
   * アクティビティ詳細を取得（権限チェック付き）
   * ユーザーが監視中のデータソースに関連するアクティビティのみ取得
   */
  findById(
    activityId: ActivityId,
    userId: string,
  ): Promise<ActivityDetail | null>

  /**
   * データソース別アクティビティ一覧を取得（権限チェック付き）
   * ユーザーが監視中のデータソースのアクティビティのみ取得
   */
  findByDataSourceId(
    input: FindByDataSourceInput,
  ): Promise<ActivityWithDataSource[]>

  /**
   * データソース別アクティビティの総件数を取得（権限チェック付き）
   */
  countByDataSourceId(
    userId: string,
    dataSourceId: string,
    filter?: ActivityFilterInput,
  ): Promise<number>
}
