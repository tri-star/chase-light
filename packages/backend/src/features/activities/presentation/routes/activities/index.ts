import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../identity/middleware/jwt-auth.middleware"
import type { ActivityDeps } from "../../../application/activity-deps"
import {
  activityDetailResponseSchema,
  activityListRequestSchema,
  activityListResponseSchema,
  activitiesErrorResponseSchemaDefinition,
} from "../../schemas"
import {
  mapActivityDetailToResponse,
  mapListResultToResponse,
} from "../../utils/response-mapper"

const createApiErrorResponse = (code: string, message: string) => ({
  success: false as const,
  error: { code, message },
})

export function createActivitiesRoutes(
  deps: Pick<
    ActivityDeps,
    "listUserActivitiesUseCase" | "getActivityDetailUseCase"
  >,
) {
  const { listUserActivitiesUseCase, getActivityDetailUseCase } = deps
  const app = new OpenAPIHono()

  const listActivitiesRoute = createRoute({
    method: "get",
    path: "/",
    summary: "ウォッチ対象アクティビティ一覧取得",
    description:
      "ユーザーがウォッチしているデータソースのアクティビティをページネーション付きで取得します",
    tags: ["Activities"],
    security: [{ Bearer: [] }],
    request: {
      query: activityListRequestSchema,
    },
    responses: {
      200: {
        description: "アクティビティ一覧の取得に成功しました",
        content: {
          "application/json": {
            schema: activityListResponseSchema,
          },
        },
      },
      ...activitiesErrorResponseSchemaDefinition,
    },
  })

  app.openapi(listActivitiesRoute, async (c) => {
    const authenticated = requireAuth(c)
    const query = c.req.valid("query")

    const result = await listUserActivitiesUseCase.execute({
      userId: authenticated.userId,
      page: query.page,
      perPage: query.perPage,
      activityType: query.activityType,
      status: query.status,
      since: query.since ? new Date(query.since) : undefined,
      until: query.until ? new Date(query.until) : undefined,
      sort: query.sort,
      order: query.order,
    })

    return c.json(mapListResultToResponse(result), 200)
  })

  const activityIdParamSchema = z
    .object({
      activityId: z.string().openapi({
        description: "アクティビティID",
        example: "1f2e3d4c-5b6a-7980-1121-314151617181",
      }),
    })
    .openapi("ActivityIdParam")

  const getActivityDetailRoute = createRoute({
    method: "get",
    path: "/{activityId}",
    summary: "アクティビティ詳細取得",
    description:
      "指定したアクティビティの詳細情報を取得します。ウォッチ対象外の場合は404を返却します",
    tags: ["Activities"],
    security: [{ Bearer: [] }],
    request: {
      params: activityIdParamSchema,
    },
    responses: {
      200: {
        description: "アクティビティ詳細の取得に成功しました",
        content: {
          "application/json": {
            schema: activityDetailResponseSchema,
          },
        },
      },
      ...activitiesErrorResponseSchemaDefinition,
    },
  })

  app.openapi(getActivityDetailRoute, async (c) => {
    const authenticated = requireAuth(c)
    const params = c.req.valid("param")

    const result = await getActivityDetailUseCase.execute({
      userId: authenticated.userId,
      activityId: params.activityId,
    })

    if (!result) {
      return c.json(
        createApiErrorResponse(
          "ACTIVITY_NOT_FOUND",
          "アクティビティが見つからないかアクセス権がありません",
        ),
        404,
      ) as never
    }

    return c.json(mapActivityDetailToResponse(result), 200)
  })

  return app
}
