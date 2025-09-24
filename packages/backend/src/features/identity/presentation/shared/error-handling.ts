import { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { userErrorResponseSchema } from "../schemas/user-error.schema"
import { UserError } from "../../errors/user.error"

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
  409: {
    content: {
      "application/json": {
        schema: userErrorResponseSchema,
      },
    },
    description: "競合エラー（重複データなど）",
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

  // UserErrorの場合は適切なレスポンスを返す
  if (error instanceof UserError) {
    return c.json(
      createErrorResponse(error.code, error.message, error.details),
      error.httpStatus,
    )
  }

  // 標準Errorの場合（下位互換性のため残しているが、新しいコードではUserErrorを使用すること）
  if (error instanceof Error) {
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
