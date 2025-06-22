/**
 * 互換性のためのレガシーschemas.ts
 * 既存のコードが動作するようにスキーマを再エクスポート
 */

// 共通スキーマ
export {
  repositoryParams,
  basicPaginationQuery,
  errorResponse,
  type RepositoryParams,
  type BasicPaginationQuery,
} from "./shared/common-schemas"

// ページネーションヘルパー
export { mapToGitHubApiOptions } from "./shared/pagination"

// バックワード互換性のために、元のdataSourceSchemasオブジェクト形式でも提供
import {
  repositoryParams,
  basicPaginationQuery,
  errorResponse,
} from "./shared/common-schemas"

// 元のdataSourceSchemasオブジェクト（一部のみ互換性のため）
export const dataSourceSchemas = {
  repositoryParams,
  basicPaginationQuery,
  errorResponse,
} as const

// 型エクスポート（互換性のため）
export type {
  RepositoryParams,
  BasicPaginationQuery,
} from "./shared/common-schemas"
