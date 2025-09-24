/**
 * Identity機能の定数
 * userフィーチャーのconstantsを統合
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

/**
 * ユーザー名制約
 *
 * アプリケーション内でのユーザー表示名に関する制限
 * - 必須フィールド（空文字不可）
 * - 最大100文字（一般的なWebアプリケーションの名前制限）
 */
export const USER_NAME = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 100,
  REQUIRED_ERROR_MESSAGE: "名前は必須です",
  MAX_LENGTH_ERROR_MESSAGE: "名前は100文字以内で入力してください",
} as const

/**
 * メールアドレス
 *
 * アプリケーション内でのユーザー表示名に関する制限
 * - 必須フィールド（空文字不可）
 * - 最大100文字（一般的なWebアプリケーションの名前制限）
 */
export const USER_EMAIL = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 255,
  REQUIRED_ERROR_MESSAGE: "メールアドレスは必須です",
  MAX_LENGTH_ERROR_MESSAGE: "メールアドレスは255文字以内で入力してください",
} as const

/**
 * タイムゾーンバリデーション関連の定数
 */
export const TIMEZONE_VALIDATION = {
  INVALID_ERROR_MESSAGE: "無効なタイムゾーンです",
} as const
