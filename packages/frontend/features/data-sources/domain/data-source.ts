import type {
  DataSourceListItem as BackendDataSourceListItem,
  DataSourceListResponseData as BackendDataSourceListResponseData,
  GetApiDataSourcesSortBy,
  GetApiDataSourcesSortOrder,
} from '~/generated/api/schemas'

// フロントエンドで利用する DataSourceListItem 型。
// Backend の API 型と差分がない場合はエイリアスで集約する。
export type DataSourceListItem = BackendDataSourceListItem

// データソース一覧レスポンス型
export type DataSourceListResponseData = BackendDataSourceListResponseData

// ソート順の型
export type DataSourceSortBy = GetApiDataSourcesSortBy
export type DataSourceSortOrder = GetApiDataSourcesSortOrder

// API レスポンスとの違いが出た場合は、上記の型を置き換え、
// Repository 内で map して返却する。
