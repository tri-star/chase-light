import type { DataSource } from "./data-source"
import type { UserWatch } from "./user-watch"

/**
 * 検索結果用の複合型（CQRS Query側）
 * DataSource（repository内包）とユーザーウォッチの情報を統合
 * repositoryフィールドは削除し、DataSource内のrepositoryを使用
 */
export type DataSourceListItem = {
  dataSource: DataSource
  userWatch: UserWatch
}

/**
 * 検索結果とページネーション情報
 */
export type DataSourceListResult = {
  items: DataSourceListItem[]
  total: number
}

/**
 * 検索フィルター型
 * データソース一覧検索で使用可能な全てのフィルタリング条件を定義
 */
export type DataSourceListFilters = {
  // 検索・フィルタリング
  name?: string
  owner?: string
  search?: string
  sourceType?: string
  isPrivate?: boolean
  language?: string
  createdAfter?: Date
  createdBefore?: Date
  updatedAfter?: Date
  updatedBefore?: Date

  // ソート
  sortBy?: "name" | "createdAt" | "updatedAt" | "addedAt" | "starsCount"
  sortOrder?: "asc" | "desc"

  // ページネーション
  offset?: number
  limit?: number
}
