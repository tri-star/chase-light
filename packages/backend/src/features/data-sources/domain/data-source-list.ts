import type { DataSource } from "./data-source"
import type { Repository } from "./repository"
import type { UserWatch } from "./user-watch"

/**
 * 検索結果用のリポジトリ型（CQRS Query側）
 * ownerフィールドを追加して利便性を向上
 */
export type DataSourceListRepository = Repository & {
  owner: string // fullNameから抽出したオーナー名
}

/**
 * 検索結果用の複合型（CQRS Query側）
 * データソース、リポジトリ、ユーザーウォッチの情報を統合
 */
export type DataSourceListItem = {
  dataSource: DataSource
  repository: DataSourceListRepository
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