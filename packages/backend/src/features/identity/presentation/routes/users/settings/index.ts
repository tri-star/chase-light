import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../../../core/auth/middleware/jwt-auth.middleware"
import { SUPPORTED_LANGUAGES } from "../../../../constants"
import type { GetProfileUseCase } from "../../../../application/use-cases/get-profile.use-case"
import type { GetSettingsUseCase } from "../../../../application/use-cases/get-settings.use-case"
import type { UpdateSettingsUseCase } from "../../../../application/use-cases/update-settings.use-case"
import { userBaseSchema } from "../../../schemas/user-base.schema"
import {
  userErrorResponseSchemaDefinition,
  handleError,
  userNotFoundResponse,
} from "../../../shared/error-handling"

export const createSettingsRoutes = (
  app: OpenAPIHono,
  getProfileUseCase: GetProfileUseCase,
  getSettingsUseCase: GetSettingsUseCase,
  updateSettingsUseCase: UpdateSettingsUseCase,
) => {
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

  app.openapi(getSettingsRoute, async (c) => {
    try {
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      const currentUser = await getProfileUseCase.execute({ auth0UserId })
      if (!currentUser) {
        return userNotFoundResponse(c)
      }

      const settingsResult = await getSettingsUseCase.execute({ auth0UserId })
      if (!settingsResult) {
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
            settings: settingsResult.settings,
          },
        },
        200,
      )
    } catch (error) {
      return handleError(c, error, "設定取得")
    }
  })

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

  app.openapi(updateSettingsRoute, async (c) => {
    try {
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      const currentUser = await getProfileUseCase.execute({ auth0UserId })
      if (!currentUser) {
        return userNotFoundResponse(c)
      }

      const data = c.req.valid("json")

      const updatedResult = await updateSettingsUseCase.execute({
        userId: currentUser.id,
        timezone: data.timezone,
        emailNotifications: data.emailNotifications,
        pushNotifications: data.pushNotifications,
        language: data.language,
      })

      if (!updatedResult) {
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

      return c.json(
        {
          user: {
            id: updatedResult.user.id,
            email: updatedResult.user.email,
            name: updatedResult.user.name,
            githubUsername: updatedResult.user.githubUsername,
            avatarUrl: updatedResult.user.avatarUrl,
            timezone: updatedResult.user.timezone,
            createdAt: updatedResult.user.createdAt?.toISOString() || "",
            updatedAt: updatedResult.user.updatedAt?.toISOString() || "",
            settings: updatedResult.settings,
          },
        },
        200,
      )
    } catch (error) {
      return handleError(c, error, "設定更新")
    }
  })
}
