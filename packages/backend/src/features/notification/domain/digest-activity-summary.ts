/**
 * Digest Activity Summary types
 * ダイジェスト通知の構造化データ型定義
 */

/**
 * 個別アクティビティの情報
 */
export interface DigestActivity {
  activityId: string
  title: string // 日本語化されたタイトル
  summary: string // AI生成の日本語要約
  url: string
}

/**
 * アクティビティ種別ごとのグループ
 */
export interface ActivityGroup {
  type: string // 'release', 'issue', 'pull_request' など
  activities: DigestActivity[]
}

/**
 * データソースごとのグループ
 */
export interface DataSourceGroup {
  dataSourceId: string
  dataSourceName: string
  activityGroups: ActivityGroup[]
}

/**
 * ダイジェスト通知の構造化データ
 */
export interface DigestActivitySummary {
  range: {
    from: string // ISO 8601 format
    to: string // ISO 8601 format
  }
  language: string // 'ja'など
  dataSources: DataSourceGroup[]
}
