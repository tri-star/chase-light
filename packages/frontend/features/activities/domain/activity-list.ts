import type {
  ActivityListResponseData as BackendActivityListResponseData,
  ActivityListResponseDataItemsItem as BackendActivityListItem,
  ActivityListResponseDataPagination as BackendActivityListPagination,
} from '~/generated/api/schemas'

// フロントエンドで利用する ActivityList の型。
// Backend の API 型と差分がない場合はエイリアスで集約する。
export type ActivityListResponseData = BackendActivityListResponseData
export type ActivityListItem = BackendActivityListItem
export type ActivityListPagination = BackendActivityListPagination

// API レスポンスとの違いが出た場合は、上記の型を置き換え、
// Repository 内で map して返却する。
