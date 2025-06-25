/**
 * User Management Routes
 * ユーザー管理API
 */
import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { HTTPException } from "hono/http-exception"
import { requireAuth } from "../../auth/middleware/jwt-auth.middleware.js"
import { userProfileService } from "../services/user-profile.service.js"
import { userSettingsService } from "../services/user-settings.service.js"
import {
  updateProfileRequestSchema,
  userProfileResponseSchema,
  updateSettingsRequestSchema,
  userSettingsResponseSchema,
  userErrorResponseSchema,
} from "./schemas.js"

const users = new OpenAPIHono()

// プロフィール取得
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
      description: "ユーザーが見つかりません",
    },
  },
})

// プロフィール更新
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
      description: "ユーザーが見つかりません",
    },
  },
})

// 設定取得
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
      description: "ユーザーが見つかりません",
    },
  },
})

// 設定更新
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
      description: "ユーザーが見つかりません",
    },
  },
})

// プロフィール取得エンドポイント
users.openapi(getProfileRoute, async (c) => {
  try {
    // 認証済みユーザーを取得
    const authenticatedUser = requireAuth(c)
    const auth0UserId = authenticatedUser.sub

    // プロフィール取得
    const user = await userProfileService.getUserProfileByAuth0Id(auth0UserId)
    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "ユーザーが見つかりません",
          },
        },
        404,
      )
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        githubUsername: user.githubUsername,
        avatarUrl: user.avatarUrl,
        timezone: user.timezone,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)

    if (error instanceof HTTPException) {
      throw error
    }

    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "プロフィール取得中にエラーが発生しました",
        },
      },
      500,
    )
  }
})

// プロフィール更新エンドポイント
users.openapi(updateProfileRoute, async (c) => {
  try {
    // 認証済みユーザーを取得
    const authenticatedUser = requireAuth(c)
    const auth0UserId = authenticatedUser.sub

    // まず現在のユーザーを取得してIDを確認
    const currentUser = await userProfileService.getUserProfileByAuth0Id(auth0UserId)
    if (!currentUser) {
      return c.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "ユーザーが見つかりません",
          },
        },
        404,
      )
    }

    // リクエストボディを取得
    const data = c.req.valid("json")

    // プロフィール更新
    const updatedUser = await userProfileService.updateUserProfile(currentUser.id, data)
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

    return c.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        githubUsername: updatedUser.githubUsername,
        avatarUrl: updatedUser.avatarUrl,
        timezone: updatedUser.timezone,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        },
        400,
      )
    }

    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "プロフィール更新中にエラーが発生しました",
        },
      },
      500,
    )
  }
})

// 設定取得エンドポイント
users.openapi(getSettingsRoute, async (c) => {
  try {
    // 認証済みユーザーを取得
    const authenticatedUser = requireAuth(c)
    const auth0UserId = authenticatedUser.sub

    // まず現在のユーザーを取得してIDを確認
    const currentUser = await userProfileService.getUserProfileByAuth0Id(auth0UserId)
    if (!currentUser) {
      return c.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "ユーザーが見つかりません",
          },
        },
        404,
      )
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

    return c.json({ settings })
  } catch (error) {
    console.error("Settings fetch error:", error)

    if (error instanceof HTTPException) {
      throw error
    }

    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "設定取得中にエラーが発生しました",
        },
      },
      500,
    )
  }
})

// 設定更新エンドポイント
users.openapi(updateSettingsRoute, async (c) => {
  try {
    // 認証済みユーザーを取得
    const authenticatedUser = requireAuth(c)
    const auth0UserId = authenticatedUser.sub

    // まず現在のユーザーを取得してIDを確認
    const currentUser = await userProfileService.getUserProfileByAuth0Id(auth0UserId)
    if (!currentUser) {
      return c.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "ユーザーが見つかりません",
          },
        },
        404,
      )
    }

    // リクエストボディを取得
    const data = c.req.valid("json")

    // 設定更新
    const updatedSettings = await userSettingsService.updateUserSettings(currentUser.id, data)
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

    return c.json({ settings: updatedSettings })
  } catch (error) {
    console.error("Settings update error:", error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        },
        400,
      )
    }

    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "設定更新中にエラーが発生しました",
        },
      },
      500,
    )
  }
})

export default users