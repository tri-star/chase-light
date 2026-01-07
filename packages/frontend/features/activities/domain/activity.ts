import type { ActivityDetail as BackendActivityDetail } from '~/generated/api/schemas'

// アクティビティ種別の型定義
export type ActivityType = 'release' | 'issue' | 'pull_request'

// フロントエンドで利用する Activity 詳細の型。
// Backend の API 型と差分がない場合はエイリアスで集約する。
export type ActivityDetail = BackendActivityDetail

// API レスポンスとの違いが出た場合は、上記の型を置き換え、
// Repository 内で map して返却する。
