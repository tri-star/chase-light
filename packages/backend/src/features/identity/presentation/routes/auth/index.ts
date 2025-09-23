import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { AuthError } from "../../../../../core/auth/errors/auth.error"
import {
  authErrorResponseSchema,
  signUpRequestSchema,
  signUpResponseSchema,
} from "../../schemas/auth.schema"
import type { SignUpUseCase } from "../../../application/use-cases/sign-up.use-case"

export const createAuthRoutes = (signUpUseCase: SignUpUseCase) => {
  const app = new OpenAPIHono()

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

  app.openapi(signUpRoute, async (c) => {
    try {
      const request = c.req.valid("json")
      const result = await signUpUseCase.execute(request)
      const statusCode = result.alreadyExists ? 200 : 201

      return c.json(
        {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            githubUsername: result.user.githubUsername ?? undefined,
            avatarUrl: result.user.avatarUrl,
            createdAt: result.user.createdAt.toISOString(),
          },
          message: result.alreadyExists
            ? "既にアカウントが存在します。ログイン情報を更新しました"
            : "ユーザー登録が完了しました",
          alreadyExists: result.alreadyExists ? true : undefined,
        },
        statusCode,
      )
    } catch (error) {
      console.error("Sign up error:", error)

      if (error instanceof AuthError) {
        return c.json(
          {
            success: false as const,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          error.httpStatus,
        )
      }

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
