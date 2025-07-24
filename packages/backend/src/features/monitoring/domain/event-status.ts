/**
 * イベントの処理ステータス定数と型定義
 */

/**
 * イベント処理ステータス定数
 */
export const EVENT_STATUS = {
  /** 検出されたが未処理の状態 */
  PENDING: "pending",
  /** 処理中 */
  PROCESSING: "processing",
  /** 処理完了 */
  COMPLETED: "completed",
  /** 処理失敗 */
  FAILED: "failed",
} as const

/**
 * イベント処理ステータスの型
 */
export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS]

/**
 * ステータスが終了状態かどうかを判定
 */
export const isTerminalStatus = (status: EventStatus): boolean => {
  return status === EVENT_STATUS.COMPLETED || status === EVENT_STATUS.FAILED
}
