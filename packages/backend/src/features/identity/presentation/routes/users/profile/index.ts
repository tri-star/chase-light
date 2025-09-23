import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../../../core/auth/middleware/jwt-auth.middleware"
import { USER_NAME, USER_EMAIL } from "../../../../constants"
import type { GetProfileUseCase } from "../../../../application/use-cases/get-profile.use-case"
import type { UpdateProfileUseCase } from "../../../../application/use-cases/update-profile.use-case"
import { userBaseSchema } from "../../../schemas/user-base.schema"
import {
  userErrorResponseSchemaDefinition,
  handleError,
  userNotFoundResponse,
} from "../../../shared/error-handling"

export const createProfileRoutes = (
  app: OpenAPIHono,
  getProfileUseCase: GetProfileUseCase,
  updateProfileUseCase: UpdateProfileUseCase,
) => {
  const userProfileResponseSchema = z
    .object({
      user: userBaseSchema,
    })
    .openapi("UserProfileResponse")

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

  app.openapi(getProfileRoute, async (c) => {
    try {
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      const user = await getProfileUseCase.execute({ auth0UserId })
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

  const updateProfileRequestSchema = z
    .object({
      name: z
        .string()
        .min(USER_NAME.MIN_LENGTH, USER_NAME.REQUIRED_ERROR_MESSAGE)
        .max(USER_NAME.MAX_LENGTH, USER_NAME.MAX_LENGTH_ERROR_MESSAGE)
        .openapi({
          example: "田中太郎",
          description: "ユーザー名",
        }),
      email: z
        .string()
        .min(USER_EMAIL.MIN_LENGTH, USER_EMAIL.REQUIRED_ERROR_MESSAGE)
        .max(USER_EMAIL.MAX_LENGTH, USER_EMAIL.MAX_LENGTH_ERROR_MESSAGE)
        .openapi({
          example: "tanaka@example.com",
          description: "メールアドレス",
        }),
      timezone: z.string().optional().openapi({
        example: "Asia/Tokyo",
        description: "タイムゾーン（IANA形式）",
      }),
    })
    .openapi("UpdateProfileRequest")

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

  app.openapi(updateProfileRoute, async (c) => {
    try {
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      const currentUser = await getProfileUseCase.execute({ auth0UserId })
      if (!currentUser) {
        return userNotFoundResponse(c)
      }

      const input = c.req.valid("json")

      const updatedUser = await updateProfileUseCase.execute({
        userId: currentUser.id,
        name: input.name,
        email: input.email,
      })

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
