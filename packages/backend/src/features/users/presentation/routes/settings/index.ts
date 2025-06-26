import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { requireAuth } from "../../../../auth/middleware/jwt-auth.middleware.js"
import type { UserProfileService } from "../../../services/user-profile.service"
import type { UserSettingsService } from "../../../services/user-settings.service"
import {
  updateSettingsRequestSchema,
  userSettingsResponseSchema,
} from "./schemas"
import {
  userErrorResponseSchemaDefinition,
  handleError,
  userNotFoundResponse,
} from "../../shared/error-handling"

/**
 * Settings Routes
 * 設定管理関連のルート定義
 */

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

/**
 * 設定ルートファクトリー
 */
export const createSettingsRoutes = (
  app: OpenAPIHono,
  userProfileService: UserProfileService,
  userSettingsService: UserSettingsService,
) => {
  // 設定取得エンドポイント
  app.openapi(getSettingsRoute, async (c) => {
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

      // 設定取得
      const settings = await userSettingsService.getUserSettings(currentUser.id)
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

      return c.json({ settings }, 200)
    } catch (error) {
      return handleError(c, error, "設定取得")
    }
  })

  // 設定更新エンドポイント
  app.openapi(updateSettingsRoute, async (c) => {
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

      // 設定更新
      const updatedSettings = await userSettingsService.updateUserSettings(
        currentUser.id,
        data,
      )
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

      return c.json({ settings: updatedSettings }, 200)
    } catch (error) {
      return handleError(c, error, "設定更新")
    }
  })
}
