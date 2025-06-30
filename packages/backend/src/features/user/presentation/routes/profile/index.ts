import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../auth/middleware/jwt-auth.middleware.js"
import type { UserProfileService } from "../../../services/user-profile.service"
import { userBaseSchema } from "../../schemas/user-base.schema"
import {
  userErrorResponseSchemaDefinition,
  handleError,
  userNotFoundResponse,
} from "../../shared/error-handling"

/**
 * Profile Routes
 * プロフィール管理関連のルート定義
 */

/**
 * プロフィールルートファクトリー
 */
export const createProfileRoutes = (
  app: OpenAPIHono,
  userProfileService: UserProfileService,
) => {
  // ===== 共通スキーマ定義 =====

  // プロフィールレスポンススキーマ定義（取得・更新共通）
  const userProfileResponseSchema = z
    .object({
      user: userBaseSchema,
    })
    .openapi("UserProfileResponse")

  // ===== プロフィール取得機能 =====

  // プロフィール取得ルート定義
  const getProfileRoute = createRoute({
    method: "get",
    path: "/profile",
    summary: "プロフィール取得",
    description: "認証済みユーザーのプロフィール情報を取得します",
    tags: ["Users"],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: userProfileResponseSchema,
          },
        },
        description: "プロフィール情報",
      },
      ...userErrorResponseSchemaDefinition,
    },
  })

  // プロフィール取得エンドポイント
  app.openapi(getProfileRoute, async (c) => {
    try {
      // 認証済みユーザーを取得
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      // プロフィール取得
      const user = await userProfileService.getUserProfileByAuth0Id(auth0UserId)
      if (!user) {
        return userNotFoundResponse(c)
      }

      return c.json(
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            githubUsername: user.githubUsername,
            avatarUrl: user.avatarUrl,
            timezone: user.timezone,
            createdAt: user.createdAt?.toISOString() || "",
            updatedAt: user.updatedAt?.toISOString() || "",
          },
        },
        200,
      )
    } catch (error) {
      return handleError(c, error, "プロフィール取得")
    }
  })

  // ===== プロフィール更新機能 =====

  // プロフィール更新スキーマ定義
  const updateProfileRequestSchema = z
    .object({
      name: z
        .string()
        .min(1, "名前は必須です")
        .max(100, "名前は100文字以内で入力してください")
        .optional()
        .openapi({
          example: "田中太郎",
          description: "ユーザー名",
        }),
      timezone: z.string().optional().openapi({
        example: "Asia/Tokyo",
        description: "タイムゾーン（IANA形式）",
      }),
    })
    .openapi("UpdateProfileRequest")

  // プロフィール更新ルート定義
  const updateProfileRoute = createRoute({
    method: "put",
    path: "/profile",
    summary: "プロフィール更新",
    description: "認証済みユーザーのプロフィール情報を更新します",
    tags: ["Users"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateProfileRequestSchema,
          },
        },
        description: "更新するプロフィール情報",
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: userProfileResponseSchema,
          },
        },
        description: "更新されたプロフィール情報",
      },
      ...userErrorResponseSchemaDefinition,
    },
  })

  // プロフィール更新エンドポイント
  app.openapi(updateProfileRoute, async (c) => {
    try {
      // 認証済みユーザーを取得
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      // まず現在のユーザーを取得してIDを確認
      const currentUser =
        await userProfileService.getUserProfileByAuth0Id(auth0UserId)
      if (!currentUser) {
        return userNotFoundResponse(c)
      }

      // リクエストボディを取得
      const data = c.req.valid("json")

      // プロフィール更新
      const updatedUser = await userProfileService.updateUserProfile(
        currentUser.id,
        data,
      )
      if (!updatedUser) {
        return c.json(
          {
            success: false,
            error: {
              code: "UPDATE_FAILED",
              message: "プロフィールの更新に失敗しました",
            },
          },
          500,
        )
      }

      return c.json(
        {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            githubUsername: updatedUser.githubUsername,
            avatarUrl: updatedUser.avatarUrl,
            timezone: updatedUser.timezone,
            createdAt: updatedUser.createdAt?.toISOString() || "",
            updatedAt: updatedUser.updatedAt?.toISOString() || "",
          },
        },
        200,
      )
    } catch (error) {
      return handleError(c, error, "プロフィール更新")
    }
  })
}
