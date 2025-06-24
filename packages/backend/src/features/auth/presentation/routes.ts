import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import {
  signUpRequestSchema,
  signUpResponseSchema,
  authErrorResponseSchema,
} from "./schemas"
import { authSignupService } from "../services/auth-signup.service"
import { AuthError } from "../errors/auth.error"

/**
 * Auth Routes
 * 認証関連APIエンドポイント
 */

// ユーザー登録エンドポイントの定義
const signUpRoute = createRoute({
  method: "post",
  path: "/signup",
  summary: "ユーザー登録",
  description: "Auth0のIDトークンを使用してユーザー登録を行います",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: signUpRequestSchema,
        },
      },
      description: "ユーザー登録リクエスト",
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: signUpResponseSchema,
        },
      },
      description: "ユーザー登録成功",
    },
    200: {
      content: {
        "application/json": {
          schema: signUpResponseSchema,
        },
      },
      description: "既存ユーザー（情報更新）",
    },
    400: {
      content: {
        "application/json": {
          schema: authErrorResponseSchema,
        },
      },
      description: "リクエストエラー（無効なIDトークンなど）",
    },
    401: {
      content: {
        "application/json": {
          schema: authErrorResponseSchema,
        },
      },
      description: "認証エラー（トークン検証失敗など）",
    },
    500: {
      content: {
        "application/json": {
          schema: authErrorResponseSchema,
        },
      },
      description: "サーバーエラー",
    },
  },
})

/**
 * Auth Routes Builder
 */
export const createAuthRoutes = () => {
  const app = new OpenAPIHono()

  // ユーザー登録エンドポイント
  app.openapi(signUpRoute, async (c) => {
    try {
      const request = c.req.valid("json")

      const result = await authSignupService.signUp(request)

      // 新規ユーザーの場合は201、既存ユーザーの場合は200を返す
      const statusCode = result.alreadyExists ? 200 : 201

      return c.json(result, statusCode as 201 | 200)
    } catch (error) {
      console.error("Sign up error:", error)

      // AuthErrorの場合は適切なステータスコードとエラー情報を返す
      if (error instanceof AuthError) {
        const errorResponse = {
          success: false as const,
          error: {
            code: error.code as string,
            message: error.message,
            details: error.details,
          },
        }

        // HTTPステータスに応じて適切なレスポンスを返す
        if (error.httpStatus === 400) {
          return c.json(errorResponse, 400)
        }
        return c.json(errorResponse, 401)
      }

      // 予期しないエラーの場合は500を返す
      return c.json(
        {
          success: false as const,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "内部サーバーエラーが発生しました",
            details: error instanceof Error ? error.message : "Unknown error",
          },
        },
        500,
      )
    }
  })

  return app
}

export default createAuthRoutes
