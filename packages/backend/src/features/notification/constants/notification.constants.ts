/**
 * 通知機能の定数定義
 */

/**
 * デフォルト値
 */
export const NOTIFICATION_DEFAULTS = {
  /** デフォルトの通知タイプ */
  NOTIFICATION_TYPE: "digest" as const,
  /** デフォルトのダイジェスト通知時刻 */
  DEFAULT_DIGEST_TIMES: ["18:00"],
  /** 1回の実行で処理する最大アクティビティ数 */
  MAX_ACTIVITIES_PER_RUN: 100,
} as const

/**
 * 制限値
 */
export const NOTIFICATION_LIMITS = {
  /** 通知タイトルの最大長 */
  MAX_TITLE_LENGTH: 200,
  /** 通知メッセージの最大長 */
  MAX_MESSAGE_LENGTH: 1000,
} as const

/**
 * エラーメッセージ
 */
export const NOTIFICATION_ERRORS = {
  ACTIVITY_NOT_FOUND: "Activity not found",
  RECIPIENT_NOT_FOUND: "Recipient not found",
  INVALID_TIMEZONE: "Invalid timezone",
  INVALID_NOTIFICATION_TIME: "Invalid notification time format",
  NO_SUBSCRIBERS: "No subscribers found for this activity",
} as const

/**
 * 通知メッセージテンプレート
 */
export const NOTIFICATION_MESSAGES = {
  RELEASE_TITLE: (repoName: string, version: string) =>
    `新しいリリース: ${repoName} ${version}`,
  RELEASE_MESSAGE: (title: string, body: string) =>
    `${title}\n\n${body.substring(0, 500)}${body.length > 500 ? "..." : ""}`,
  ISSUE_TITLE: (repoName: string, issueNumber: string) =>
    `新しいIssue: ${repoName} #${issueNumber}`,
  ISSUE_MESSAGE: (title: string, body: string) =>
    `${title}\n\n${body.substring(0, 500)}${body.length > 500 ? "..." : ""}`,
  PULL_REQUEST_TITLE: (repoName: string, prNumber: string) =>
    `新しいPR: ${repoName} #${prNumber}`,
  PULL_REQUEST_MESSAGE: (title: string, body: string) =>
    `${title}\n\n${body.substring(0, 500)}${body.length > 500 ? "..." : ""}`,
} as const
