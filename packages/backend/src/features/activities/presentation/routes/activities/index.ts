/**
 * アクティビティルート定義
 */

import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../identity/middleware/jwt-auth.middleware"
import type {
  ListUserActivitiesUseCase,
  GetActivityDetailUseCase,
} from "../../../application/use-cases"
import {
  ActivityListQuerySchema,
  ActivityListResponseSchema,
  ActivityDetailResponseSchema,
} from "../../schemas"
import { handleActivityError, ActivityError } from "../../shared/error-handling"
import { toActivityId } from "../../../domain/activity"

/**
 * エラーレスポンススキーマ定義
 */
const activityErrorResponseSchemaDefinition = {
  400: {
    content: {
      "application/json": {
        schema: z.object({
          success: z.literal(false),
          error: z.object({
            code: z.string(),
            message: z.string(),
            details: z.object({}).optional(),
          }),
        }),
      },
    },
    description: "バリデーションエラー",
  },
  401: {
    content: {
      "application/json": {
        schema: z.object({
          success: z.literal(false),
          error: z.object({
            code: z.string(),
            message: z.string(),
          }),
        }),
      },
    },
    description: "認証エラー",
  },
  404: {
    content: {
      "application/json": {
        schema: z.object({
          success: z.literal(false),
          error: z.object({
            code: z.string(),
            message: z.string(),
            details: z.object({}).optional(),
          }),
        }),
      },
    },
    description: "リソースが見つかりません",
  },
  500: {
    content: {
      "application/json": {
        schema: z.object({
          success: z.literal(false),
          error: z.object({
            code: z.string(),
            message: z.string(),
          }),
        }),
      },
    },
    description: "サーバーエラー",
  },
}

/**
 * アクティビティルート作成
 */
export function createActivityRoutes(
  listUserActivitiesUseCase: ListUserActivitiesUseCase,
  getActivityDetailUseCase: GetActivityDetailUseCase,
) {
  const app = new OpenAPIHono()

  // ===== アクティビティ一覧取得機能 =====

  /**
   * GET /activities ルート定義
   */
  const listActivitiesRoute = createRoute({
    method: "get",
    path: "/",
    summary: "ユーザーのアクティビティ一覧取得",
    description:
      "ユーザーが監視中のデータソースに関連するアクティビティ一覧を取得します。フィルタリング、ソート、ページネーションに対応しています",
    tags: ["Activities"],
    security: [{ Bearer: [] }],
    request: {
      query: ActivityListQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: ActivityListResponseSchema,
          },
        },
        description: "アクティビティ一覧が正常に取得されました",
      },
      ...activityErrorResponseSchemaDefinition,
    },
  })

  /**
   * GET /activities - アクティビティ一覧取得エンドポイント
   */
  app.openapi(listActivitiesRoute, async (c) => {
    try {
      const authenticatedUser = requireAuth(c)
      const userId = authenticatedUser.sub

      const query = c.req.valid("query")

      const result = await listUserActivitiesUseCase.execute({
        userId,
        filter: {
          activityType: query.activityType,
          status: query.status,
          createdAfter: query.createdAfter
            ? new Date(query.createdAfter)
            : undefined,
          createdBefore: query.createdBefore
            ? new Date(query.createdBefore)
            : undefined,
          updatedAfter: query.updatedAfter
            ? new Date(query.updatedAfter)
            : undefined,
          updatedBefore: query.updatedBefore
            ? new Date(query.updatedBefore)
            : undefined,
        },
        pagination: {
          page: query.page,
          perPage: query.perPage,
        },
        sort: {
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        },
      })

      return c.json(
        {
          success: true,
          data: {
            items: result.items.map((item) => ({
              id: item.id,
              dataSource: {
                id: item.dataSource.id,
                name: item.dataSource.name,
                url: item.dataSource.url,
              },
              activityType: item.activityType,
              title: item.title,
              body: item.body,
              version: item.version,
              status: item.status,
              createdAt: item.createdAt.toISOString(),
              updatedAt: item.updatedAt.toISOString(),
            })),
            pagination: result.pagination,
          },
        },
        200,
      )
    } catch (error) {
      return handleActivityError(c, error, "list")
    }
  })

  // ===== アクティビティ詳細取得機能 =====

  /**
   * GET /activities/:id ルート定義
   */
  const getActivityDetailRoute = createRoute({
    method: "get",
    path: "/:id",
    summary: "アクティビティ詳細取得",
    description:
      "指定されたIDのアクティビティ詳細を取得します。ユーザーが監視中のデータソースに関連するアクティビティのみアクセス可能です",
    tags: ["Activities"],
    security: [{ Bearer: [] }],
    request: {
      params: z.object({
        id: z.string().uuid().openapi({
          description: "アクティビティID（UUID形式）",
          example: "550e8400-e29b-41d4-a716-446655440000",
        }),
      }),
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: ActivityDetailResponseSchema,
          },
        },
        description: "アクティビティ詳細が正常に取得されました",
      },
      ...activityErrorResponseSchemaDefinition,
    },
  })

  /**
   * GET /activities/:id - アクティビティ詳細取得エンドポイント
   */
  app.openapi(getActivityDetailRoute, async (c) => {
    try {
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      const { id } = c.req.valid("param")

      const result = await getActivityDetailUseCase.execute({
        activityId: toActivityId(id),
        userId: auth0UserId,
      })

      if (!result) {
        throw ActivityError.activityNotFound(id)
      }

      return c.json(
        {
          success: true,
          data: {
            id: result.id,
            dataSource: {
              id: result.dataSource.id,
              name: result.dataSource.name,
              description: result.dataSource.description,
              url: result.dataSource.url,
            },
            activityType: result.activityType,
            title: result.title,
            body: result.body,
            version: result.version,
            status: result.status,
            statusDetail: result.statusDetail,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        },
        200,
      )
    } catch (error) {
      return handleActivityError(c, error, "get detail")
    }
  })

  return app
}
