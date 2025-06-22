import { Context, TypedResponse } from "hono"
import {
  GitHubApiError,
  GitHubRateLimitError,
  GitHubAuthenticationError,
} from "../../errors/github-api.error"
import { GitHubApiParseError } from "../../errors/github-parse.error"
import { errorResponse } from "./common-schemas"

type GitHubApiErrorResponse = {
  success: boolean
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export const githubErrorResponseSchemaDefinition = {
  400: {
    content: {
      "application/json": {
        schema: errorResponse,
      },
    },
    description: "Bad Request",
  },
  401: {
    content: {
      "application/json": {
        schema: errorResponse,
      },
    },
    description: "認証エラー",
  },
  404: {
    content: {
      "application/json": {
        schema: errorResponse,
      },
    },
    description: "リソースが見つかりません",
  },
  422: {
    content: {
      "application/json": {
        schema: errorResponse,
      },
    },
    description: "認証エラー",
  },
  429: {
    content: {
      "application/json": {
        schema: errorResponse,
      },
    },
    description: "レート制限エラー",
  },
  500: {
    content: {
      "application/json": {
        schema: errorResponse,
      },
    },
    description: "内部サーバーエラー",
  },
}

/**
 * エラーハンドリング関数
 * GitHub API特有のエラーを適切なHTTPステータスコードとレスポンスに変換
 */
export function handleError<C extends Context>(
  c: C,
  error: unknown,
): TypedResponse<GitHubApiErrorResponse, 400 | 401 | 404 | 422 | 429 | 500> {
  console.error("DataSource API Error:", error)

  // GitHub認証エラー
  if (error instanceof GitHubAuthenticationError) {
    return c.json(
      {
        success: false,
        error: {
          code: "GITHUB_AUTH_ERROR",
          message: "GitHub認証に失敗しました",
          details: {
            message: error.message,
          },
        },
      },
      401,
    )
  }

  // GitHub Rate Limitエラー
  if (error instanceof GitHubRateLimitError) {
    return c.json(
      {
        success: false,
        error: {
          code: "GITHUB_RATE_LIMIT",
          message: "GitHub APIのレート制限に達しました",
          details: {
            resetTime: error.resetTime,
            remaining: error.remaining,
          },
        },
      },
      429,
    )
  }

  // GitHub一般的なAPIエラー
  if (error instanceof GitHubApiError) {
    const statusCode = error.status === 404 ? 404 : 400
    return c.json(
      {
        success: false,
        error: {
          code: "GITHUB_API_ERROR",
          message: "GitHub APIエラーが発生しました",
          details: {
            status: error.status,
            originalMessage: error.message,
          },
        },
      },
      statusCode,
    )
  }

  // GitHub APIパースエラー
  if (error instanceof GitHubApiParseError) {
    return c.json(
      {
        success: false,
        error: {
          code: "GITHUB_PARSE_ERROR",
          message: "GitHub APIレスポンスの解析に失敗しました",
          details: {
            originalMessage: error.message,
            errors: error.getFormattedErrors(),
          },
        },
      },
      422,
    )
  }

  // その他の予期しないエラー
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "内部サーバーエラーが発生しました",
      },
    },
    500,
  )
}
