/**
 * Identity機能のデフォルト値定数
 */

/**
 * サポート言語の定義
 */
export type SupportedLanguage = "ja" | "en"

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  "ja",
  "en",
] as const

/**
 * デフォルトのタイムゾーン
 * 日本のユーザーを主要ターゲットとしているため、Asia/Tokyoをデフォルトとする
 */
export const DEFAULT_TIMEZONE = "Asia/Tokyo"

/**
 * デフォルトの言語設定
 * 日本語をデフォルト言語とする
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = "ja"

/**
 * デフォルトの通知設定
 */
export const DEFAULT_NOTIFICATIONS = {
  emailNotifications: true, // 将来的にDBに保存
  pushNotifications: false, // 将来的にDBに保存
} as const
