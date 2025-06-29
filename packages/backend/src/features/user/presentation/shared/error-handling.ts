import { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { userErrorResponseSchema } from "../schemas/user-error.schema"

/**
 * Users API共通エラーハンドリング
 * ユーザー管理API全体で共通で使用されるエラーハンドリング機能
 */

type UserApiErrorResponse = {
  success: boolean
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export const userErrorResponseSchemaDefinition = {
  400: {
    content: {
      "application/json": {
        schema: userErrorResponseSchema,
      },
    },
    description: "バリデーションエラー",
  },
  401: {
    content: {
      "application/json": {
        schema: userErrorResponseSchema,
      },
    },
    description: "認証エラー",
  },
  404: {
    content: {
      "application/json": {
        schema: userErrorResponseSchema,
      },
    },
    description: "リソースが見つかりません",
  },
  500: {
    content: {
      "application/json": {
        schema: userErrorResponseSchema,
      },
    },
    description: "内部サーバーエラー",
  },
}

/**
 * 統一されたエラーレスポンスを生成
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): UserApiErrorResponse {
  const response: UserApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  }

  if (details) {
    response.error.details = details
  }

  return response
}

/**
 * エラーハンドリングユーティリティ
 * 各ルートハンドラーで使用する共通エラー処理
 */
export function handleError(c: Context, error: unknown, operationName: string) {
  console.error(`${operationName} error:`, error)

  // HTTPExceptionの場合はそのまま再スロー
  if (error instanceof HTTPException) {
    throw error
  }

  // 標準Errorの場合
  if (error instanceof Error) {
    // 明示的なバリデーションエラーメッセージの場合は400
    const validationErrorPatterns = [
      "このメールアドレスは既に使用されています",
      "このGitHubユーザー名は既に使用されています",
      "無効なタイムゾーンです",
      "サポートされていない言語です",
    ]

    if (
      validationErrorPatterns.some((pattern) => error.message.includes(pattern))
    ) {
      return c.json(createErrorResponse("VALIDATION_ERROR", error.message), 400)
    }

    // その他のErrorは内部エラーとして扱う (Database error等)
    return c.json(
      createErrorResponse(
        "INTERNAL_ERROR",
        `${operationName}中にエラーが発生しました`,
      ),
      500,
    )
  }

  // その他の場合は内部エラー
  return c.json(
    createErrorResponse(
      "INTERNAL_ERROR",
      `${operationName}中にエラーが発生しました`,
    ),
    500,
  )
}

/**
 * ユーザーが見つからない場合の404エラーレスポンス
 */
export function userNotFoundResponse(c: Context) {
  return c.json(
    createErrorResponse("USER_NOT_FOUND", "ユーザーが見つかりません"),
    404,
  )
}

/**
 * 認証エラーレスポンス
 */
export function authenticationErrorResponse(c: Context) {
  return c.json(
    createErrorResponse("AUTHENTICATION_ERROR", "認証に失敗しました"),
    401,
  )
}
