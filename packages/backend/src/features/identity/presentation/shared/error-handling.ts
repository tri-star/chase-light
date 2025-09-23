import type { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { userErrorResponseSchema } from "../schemas/user-error.schema"
import { UserError } from "../../errors/user.error"

interface UserApiErrorResponse {
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

export function handleError(c: Context, error: unknown, operationName: string) {
  console.error(`${operationName} error:`, error)

  if (error instanceof HTTPException) {
    throw error
  }

  if (error instanceof UserError) {
    return c.json(
      createErrorResponse(error.code, error.message, error.details),
      error.httpStatus,
    )
  }

  if (error instanceof Error) {
    return c.json(
      createErrorResponse(
        "INTERNAL_ERROR",
        `${operationName}中にエラーが発生しました`,
      ),
      500,
    )
  }

  return c.json(
    createErrorResponse(
      "INTERNAL_ERROR",
      `${operationName}中にエラーが発生しました`,
    ),
    500,
  )
}

export function userNotFoundResponse(c: Context) {
  return c.json(
    createErrorResponse("USER_NOT_FOUND", "ユーザーが見つかりません"),
    404,
  )
}

export function authenticationErrorResponse(c: Context) {
  return c.json(
    createErrorResponse("AUTHENTICATION_ERROR", "認証に失敗しました"),
    401,
  )
}
