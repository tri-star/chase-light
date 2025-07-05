/**
 * User機能固有のバリデーション制約定数
 */

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
