import type {
  DataSourceListItem as BackendDataSourceListItem,
  DataSourceActivityListResponseData as BackendDataSourceActivityListResponseData,
  DataSourceActivityListResponseDataDataSource,
  DataSourceActivityListResponseDataItemsItem,
  DataSourceActivityListResponseDataPagination,
} from '~/generated/api/schemas'

// フロントエンドで利用するデータソース詳細型
// Backend APIの DataSourceListItem をそのまま利用
export type DataSourceDetail = BackendDataSourceListItem

// データソース別アクティビティ一覧レスポンス型
export type DataSourceActivityListResponseData =
  BackendDataSourceActivityListResponseData

// データソース別アクティビティ一覧のデータソース情報
export type DataSourceActivityDataSource =
  DataSourceActivityListResponseDataDataSource

// データソース別アクティビティ一覧のアクティビティアイテム
export type DataSourceActivityItem = DataSourceActivityListResponseDataItemsItem

// データソース別アクティビティ一覧のページネーション
export type DataSourceActivityPagination =
  DataSourceActivityListResponseDataPagination
