import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../middleware/jwt-auth.middleware"
import { SUPPORTED_LANGUAGES } from "../../../constants/identity.constants"
import { userBaseSchema } from "../../schemas/user-base.schema"
import {
  userErrorResponseSchemaDefinition,
  handleError,
  userNotFoundResponse,
} from "../../shared/error-handling"
import { GetUserProfileUseCase } from "../../../application/use-cases/get-user-profile.use-case"
import { GetUserSettingsUseCase } from "../../../application/use-cases/get-user-settings.use-case"
import { UpdateUserSettingsUseCase } from "../../../application/use-cases/update-user-settings.use-case"
import { DrizzleUserRepository } from "../../../infra/repositories/drizzle-user.repository"

/**
 * Settings Routes
 * 設定管理関連のルート定義
 */

/**
 * 設定ルートファクトリー
 */
export const createSettingsRoutes = (app: OpenAPIHono) => {
  // UseCaseの依存関係を構築
  const userRepository = new DrizzleUserRepository()
  const getUserProfileUseCase = new GetUserProfileUseCase(userRepository)
  const getUserSettingsUseCase = new GetUserSettingsUseCase(userRepository)
  const updateUserSettingsUseCase = new UpdateUserSettingsUseCase(
    userRepository,
  )
  // ===== 共通スキーマ定義 =====

  // 設定レスポンススキーマ定義（取得・更新共通）
  const userSettingsResponseSchema = z
    .object({
      user: userBaseSchema.extend({
        settings: z.object({
          timezone: z.string().openapi({
            example: "Asia/Tokyo",
            description: "タイムゾーン",
          }),
          emailNotifications: z.boolean().openapi({
            example: true,
            description: "メール通知の有効/無効",
          }),
          pushNotifications: z.boolean().openapi({
            example: false,
            description: "プッシュ通知の有効/無効",
          }),
          language: z.enum(SUPPORTED_LANGUAGES).openapi({
            example: "ja",
            description: "表示言語",
          }),
        }),
      }),
    })
    .openapi("UserSettingsResponse")

  // ===== 設定取得機能 =====

  // 設定取得ルート定義
  const getSettingsRoute = createRoute({
    method: "get",
    path: "/settings",
    summary: "ユーザー設定取得",
    description: "認証済みユーザーの設定情報を取得します",
    tags: ["Users"],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: userSettingsResponseSchema,
          },
        },
        description: "ユーザー設定情報",
      },
      ...userErrorResponseSchemaDefinition,
    },
  })

  // 設定取得エンドポイント
  app.openapi(getSettingsRoute, async (c) => {
    try {
      // 認証済みユーザーを取得
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      // まず現在のユーザーを取得してIDを確認
      const currentUser = await getUserProfileUseCase.getUserProfileByAuth0Id({
        auth0UserId,
      })
      if (!currentUser) {
        return userNotFoundResponse(c)
      }

      // 設定取得
      const settings = await getUserSettingsUseCase.getUserSettings({
        userId: currentUser.id,
      })
      if (!settings) {
        return c.json(
          {
            success: false,
            error: {
              code: "SETTINGS_NOT_FOUND",
              message: "設定が見つかりません",
            },
          },
          404,
        )
      }

      return c.json(
        {
          user: {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            githubUsername: currentUser.githubUsername,
            avatarUrl: currentUser.avatarUrl,
            timezone: currentUser.timezone,
            createdAt: currentUser.createdAt?.toISOString() || "",
            updatedAt: currentUser.updatedAt?.toISOString() || "",
            settings: {
              timezone: currentUser.timezone,
              emailNotifications: settings.emailNotifications,
              pushNotifications: settings.pushNotifications,
              language: settings.language,
            },
          },
        },
        200,
      )
    } catch (error) {
      return handleError(c, error, "設定取得")
    }
  })

  // ===== 設定更新機能 =====

  // 設定更新スキーマ定義
  const updateSettingsRequestSchema = z
    .object({
      timezone: z.string().optional().openapi({
        example: "Asia/Tokyo",
        description: "タイムゾーン（IANA形式）",
      }),
      emailNotifications: z.boolean().optional().openapi({
        example: true,
        description: "メール通知の有効/無効",
      }),
      pushNotifications: z.boolean().optional().openapi({
        example: false,
        description: "プッシュ通知の有効/無効",
      }),
      language: z.enum(SUPPORTED_LANGUAGES).optional().openapi({
        example: "ja",
        description: "表示言語（ja/en）",
      }),
    })
    .openapi("UpdateSettingsRequest")

  // 設定更新ルート定義
  const updateSettingsRoute = createRoute({
    method: "put",
    path: "/settings",
    summary: "ユーザー設定更新",
    description: "認証済みユーザーの設定情報を更新します",
    tags: ["Users"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateSettingsRequestSchema,
          },
        },
        description: "更新する設定情報",
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: userSettingsResponseSchema,
          },
        },
        description: "更新された設定情報",
      },
      ...userErrorResponseSchemaDefinition,
    },
  })

  // 設定更新エンドポイント
  app.openapi(updateSettingsRoute, async (c) => {
    try {
      // 認証済みユーザーを取得
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      // まず現在のユーザーを取得してIDを確認
      const currentUser = await getUserProfileUseCase.getUserProfileByAuth0Id({
        auth0UserId,
      })
      if (!currentUser) {
        return userNotFoundResponse(c)
      }

      // リクエストボディを取得
      const data = c.req.valid("json")

      // 設定更新
      const updatedSettings =
        await updateUserSettingsUseCase.updateUserSettings({
          userId: currentUser.id,
          timezone: data.timezone,
          emailNotifications: data.emailNotifications,
          pushNotifications: data.pushNotifications,
          language: data.language,
        })
      if (!updatedSettings) {
        return c.json(
          {
            success: false,
            error: {
              code: "UPDATE_FAILED",
              message: "設定の更新に失敗しました",
            },
          },
          500,
        )
      }

      // 更新後のユーザー情報を取得
      const updatedUser = await getUserProfileUseCase.getUserProfileById({
        userId: currentUser.id,
      })
      if (!updatedUser) {
        return c.json(
          {
            success: false,
            error: {
              code: "UPDATE_FAILED",
              message: "ユーザー情報の取得に失敗しました",
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
            settings: {
              timezone: updatedUser.timezone,
              emailNotifications: updatedSettings.emailNotifications,
              pushNotifications: updatedSettings.pushNotifications,
              language: updatedSettings.language,
            },
          },
        },
        200,
      )
    } catch (error) {
      return handleError(c, error, "設定更新")
    }
  })
}
