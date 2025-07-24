/**
 * 監視機能関連の型定義
 */

/**
 * detect-datasource-updatesワーカーの入力型
 */
export type DetectUpdatesInput = {
  /** 監視対象のデータソースID（UUID） */
  dataSourceId: string
}

/**
 * detect-datasource-updatesワーカーの出力型
 */
export type DetectUpdatesOutput = {
  /** 新規作成されたイベントのID配列 */
  newEventIds: string[]
}

/**
 * GitHub APIから取得したリリース情報
 */
export type GitHubRelease = {
  id: number
  tag_name: string
  name: string | null
  body: string | null
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string | null
  html_url: string
}

/**
 * GitHub APIから取得したIssue情報
 */
export type GitHubIssue = {
  id: number
  number: number
  title: string
  body: string | null
  state: "open" | "closed"
  created_at: string
  updated_at: string
  closed_at: string | null
  html_url: string
  user: {
    login: string
    avatar_url: string
  }
}

/**
 * GitHub APIから取得したPullRequest情報
 */
export type GitHubPullRequest = {
  id: number
  number: number
  title: string
  body: string | null
  state: "open" | "closed"
  created_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  html_url: string
  user: {
    login: string
    avatar_url: string
  }
}

/**
 * イベントタイプ定数
 */
export const EVENT_TYPE = {
  RELEASE: "release",
  ISSUE: "issue",
  PULL_REQUEST: "pull_request",
} as const

/**
 * イベントタイプの型
 */
export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE]
