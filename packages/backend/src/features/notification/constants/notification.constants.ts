/**
 * Notification constants
 * 通知機能で使用する定数
 */

/**
 * ダイジェスト通知の最大遡り日数
 * 初回実行時は最大この日数まで過去のアクティビティを取得する
 */
export const MAX_DAYS_LOOKBACK = 7

/**
 * データソース＋種別ごとの最大アクティビティ数
 * 各データソースの各種別につき、この数まで最新のアクティビティを取得する
 */
export const MAX_ACTIVITIES_PER_DATA_SOURCE_AND_TYPE = 3

/**
 * AI要約の最大トークン数
 * バッチ処理用に増量（グループ単位で複数アクティビティを処理）
 */
export const MAX_SUMMARY_TOKENS = 1000

/**
 * AI要約のタイムアウト時間（ミリ秒）
 */
export const SUMMARIZATION_TIMEOUT_MS = 30000

/**
 * AI要約失敗時のデフォルトフォールバック文字列
 */
export const DEFAULT_FALLBACK_SUMMARY = "(要約なし)"

/**
 * ワーカー名: ダイジェスト通知生成
 */
export const WORKER_NAME_GENERATE_DIGEST = "generate-digest-notifications"
