/**
 * 監視機能の定数定義
 */

/**
 * デフォルト値
 */
export const DETECTION_DEFAULTS = {
  /** 初回実行時の過去データ取得期間（日数） */
  INITIAL_LOOKBACK_DAYS: 7,
  /** ページあたりの最大取得件数 */
  PAGE_SIZE: 100,
  /** APIリクエストのタイムアウト（ミリ秒） */
  API_TIMEOUT_MS: 30_000,
} as const

/**
 * 制限値
 */
export const DETECTION_LIMITS = {
  /** 1回の実行で処理する最大イベント数 */
  MAX_EVENTS_PER_RUN: 1000,
  /** GitHub APIのレート制限考慮の最大ページ数 */
  MAX_PAGES: 10,
} as const

/**
 * エラーメッセージ
 */
export const DETECTION_ERRORS = {
  DATA_SOURCE_NOT_FOUND: "Data source not found",
  REPOSITORY_NOT_FOUND: "Repository information not found for data source",
  GITHUB_API_ERROR: "GitHub API request failed",
  RATE_LIMIT_EXCEEDED: "GitHub API rate limit exceeded",
  INVALID_INPUT: "Invalid input parameters",
} as const
