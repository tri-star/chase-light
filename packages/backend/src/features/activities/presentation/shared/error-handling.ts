/**
 * アクティビティエラーハンドリング
 */

import type { Context } from "hono"

/**
 * アクティビティエラーコード定義
 */
export const ACTIVITY_ERROR_CODES = {
  ACTIVITY_NOT_FOUND: "ACTIVITY_NOT_FOUND",
  DATA_SOURCE_NOT_FOUND: "DATA_SOURCE_NOT_FOUND",
  INVALID_PARAMETER: "INVALID_PARAMETER",
  UNAUTHORIZED: "UNAUTHORIZED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const

export type ActivityErrorCode =
  (typeof ACTIVITY_ERROR_CODES)[keyof typeof ACTIVITY_ERROR_CODES]

/**
 * エラー詳細情報の型定義
 */
export type ErrorDetails = {
  field?: string
  value?: string
}

/**
 * アクティビティカスタムエラークラス
 */
export class ActivityError extends Error {
  public readonly code: ActivityErrorCode
  public readonly httpStatus: number
  public readonly details?: ErrorDetails

  constructor(params: {
    code: ActivityErrorCode
    message: string
    httpStatus: number
    details?: ErrorDetails
  }) {
    super(params.message)
    this.name = "ActivityError"
    this.code = params.code
    this.httpStatus = params.httpStatus
    this.details = params.details
  }

  static activityNotFound(activityId?: string): ActivityError {
    return new ActivityError({
      code: ACTIVITY_ERROR_CODES.ACTIVITY_NOT_FOUND,
      message: "アクティビティが見つかりません、またはアクセス権限がありません",
      httpStatus: 404,
      details: activityId ? { field: "id", value: activityId } : undefined,
    })
  }

  static dataSourceNotFound(dataSourceId?: string): ActivityError {
    return new ActivityError({
      code: ACTIVITY_ERROR_CODES.DATA_SOURCE_NOT_FOUND,
      message: "データソースが見つかりません、またはアクセス権限がありません",
      httpStatus: 404,
      details: dataSourceId
        ? { field: "dataSourceId", value: dataSourceId }
        : undefined,
    })
  }

  static invalidParameter(field: string, message?: string): ActivityError {
    return new ActivityError({
      code: ACTIVITY_ERROR_CODES.INVALID_PARAMETER,
      message: message || `無効なパラメータです: ${field}`,
      httpStatus: 400,
      details: { field },
    })
  }

  static unauthorized(message?: string): ActivityError {
    return new ActivityError({
      code: ACTIVITY_ERROR_CODES.UNAUTHORIZED,
      message: message || "認証が必要です",
      httpStatus: 401,
    })
  }

  static internalError(message?: string): ActivityError {
    return new ActivityError({
      code: ACTIVITY_ERROR_CODES.INTERNAL_ERROR,
      message: message || "内部サーバーエラーが発生しました",
      httpStatus: 500,
    })
  }
}

/**
 * アクティビティ操作のエラーハンドリング
 */
export function handleActivityError(
  c: Context,
  error: unknown,
  operation: string,
) {
  console.error(`Activity ${operation} error:`, error)

  // 既知のカスタムエラー
  if (error instanceof ActivityError) {
    return c.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      error.httpStatus as 400 | 401 | 404 | 500,
    )
  }

  // その他のエラー
  const activityError = ActivityError.internalError()
  return c.json(
    {
      success: false,
      error: {
        code: activityError.code,
        message: activityError.message,
      },
    },
    activityError.httpStatus as 500,
  )
}
