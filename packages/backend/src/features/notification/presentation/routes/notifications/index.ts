import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../identity/middleware/jwt-auth.middleware"
import {
  notificationDetailResponseSchema,
  notificationListRequestSchema,
  notificationListResponseSchema,
} from "../../schemas"
import {
  mapListResultToResponse,
  mapNotificationDetailToResponse,
} from "../../utils/response-mapper"
import { NOTIFICATIONS_ERROR } from "../../../constants/query.constants"
import { NotificationInvalidCursorError } from "../../../errors/notification-invalid-cursor.error"
import { ListNotificationsUseCase } from "../../../application/use-cases/list-notifications.use-case"
import { GetNotificationDetailUseCase } from "../../../application/use-cases/get-notification-detail.use-case"

type ErrorResponse = {
  success: false
  error: {
    code: string
    message: string
  }
}

const errorResponseSchema = z
  .object({
    success: z.literal(false).openapi({ example: false }),
    error: z.object({
      code: z.string().openapi({ example: "NOTIFICATIONS_INVALID_CURSOR" }),
      message: z.string().openapi({ example: "カーソル形式が不正です" }),
    }),
  })
  .openapi("NotificationErrorResponse")

const createErrorResponse = (code: string, message: string): ErrorResponse => ({
  success: false,
  error: { code, message },
})

const NOTIFICATION_NOT_FOUND = "NOTIFICATION_NOT_FOUND"

export function createNotificationRoutes(
  listNotificationsUseCase: ListNotificationsUseCase,
  getNotificationDetailUseCase: GetNotificationDetailUseCase,
) {
  const app = new OpenAPIHono()

  // ===== 通知一覧取得機能 =====

  // 通知一覧取得ルート定義
  const listNotificationsRoute = createRoute({
    method: "get",
    path: "/",
    summary: "通知一覧の取得",
    description:
      "カーソルベースのページネーションに対応した通知一覧を返却します",
    tags: ["Notifications"],
    security: [{ Bearer: [] }],
    request: {
      query: notificationListRequestSchema,
    },
    responses: {
      200: {
        description: "通知一覧の取得に成功しました",
        content: {
          "application/json": { schema: notificationListResponseSchema },
        },
      },
      400: {
        description: "不正なカーソル指定",
        content: {
          "application/json": { schema: errorResponseSchema },
        },
      },
    },
  })

  // 通知一覧取得エンドポイント
  app.openapi(listNotificationsRoute, async (c) => {
    const authenticated = requireAuth(c)
    const query = c.req.valid("query")

    try {
      const result = await listNotificationsUseCase.execute({
        userId: authenticated.userId,
        cursor: query.cursor,
        limit: query.limit,
        read: query.read,
        search: query.search?.trim() || undefined,
      })

      return c.json(mapListResultToResponse(result), 200)
    } catch (error) {
      if (error instanceof NotificationInvalidCursorError) {
        return c.json(
          createErrorResponse(
            NOTIFICATIONS_ERROR.INVALID_CURSOR,
            "カーソル形式が不正です",
          ),
          400,
        ) as never
      }

      throw error
    }
  })

  // ===== 通知詳細取得機能 =====

  // 通知詳細取得ルート定義
  const notificationIdParamSchema = z
    .object({
      notificationId: z.string().uuid().openapi({
        description: "通知ID",
        example: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
      }),
    })
    .openapi("NotificationIdParam")

  const getNotificationDetailRoute = createRoute({
    method: "get",
    path: "/{notificationId}",
    summary: "通知詳細の取得",
    description: "指定された通知の詳細を返却します",
    tags: ["Notifications"],
    security: [{ Bearer: [] }],
    request: {
      params: notificationIdParamSchema,
    },
    responses: {
      200: {
        description: "通知詳細の取得に成功しました",
        content: {
          "application/json": { schema: notificationDetailResponseSchema },
        },
      },
      404: {
        description: "通知が存在しない、またはアクセス権がありません",
        content: {
          "application/json": { schema: errorResponseSchema },
        },
      },
    },
  })

  // 通知詳細取得エンドポイント
  app.openapi(getNotificationDetailRoute, async (c) => {
    const authenticated = requireAuth(c)
    const params = c.req.valid("param")

    const item = await getNotificationDetailUseCase.execute({
      userId: authenticated.userId,
      notificationId: params.notificationId,
    })

    if (!item) {
      return c.json(
        createErrorResponse(
          NOTIFICATION_NOT_FOUND,
          "通知が見つからないかアクセス権がありません",
        ),
        404,
      ) as never
    }

    return c.json(mapNotificationDetailToResponse(item), 200)
  })

  return app
}
