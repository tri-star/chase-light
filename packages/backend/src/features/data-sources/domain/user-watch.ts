/**
 * ユーザーウォッチのドメイン型定義
 * ユーザーがデータソースを監視する設定を表現
 */
export type UserWatch = {
  id: string
  userId: string
  dataSourceId: string
  notificationEnabled: boolean
  watchReleases: boolean
  watchIssues: boolean
  watchPullRequests: boolean
  addedAt: Date
}

/**
 * ユーザーウォッチ作成時の入力型
 */
export type UserWatchCreationInput = {
  userId: string
  dataSourceId: string
  notificationEnabled: boolean
  watchReleases: boolean
  watchIssues: boolean
  watchPullRequests: boolean
}

/**
 * ユーザーウォッチ更新時の入力型
 */
export type UserWatchUpdateInput = {
  notificationEnabled?: boolean
  watchReleases?: boolean
  watchIssues?: boolean
  watchPullRequests?: boolean
}
