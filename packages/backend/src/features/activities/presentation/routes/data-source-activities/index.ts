import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../identity/middleware/jwt-auth.middleware"
import type { ListDataSourceActivitiesUseCase } from "../../../application/use-cases"
import {
  activityListRequestSchema,
  dataSourceActivityListResponseSchema,
  activitiesErrorResponseSchemaDefinition,
} from "../../schemas"
import { mapDataSourceActivitiesResultToResponse } from "../../utils/response-mapper"

export function createDataSourceActivitiesRoutes(
  listDataSourceActivitiesUseCase: ListDataSourceActivitiesUseCase,
) {
  const app = new OpenAPIHono()

  const dataSourceParamSchema = z
    .object({
      dataSourceId: z.string().uuid().openapi({
        description: "データソースID",
        example: "8a9d3d7f-4c62-4b8c-8b3a-6b5c5d6e7f8a",
      }),
    })
    .openapi("DataSourceIdParam")

  const listDataSourceActivitiesRoute = createRoute({
    method: "get",
    path: "/{dataSourceId}/activities",
    summary: "データソース別アクティビティ一覧取得",
    description:
      "指定データソースに紐づくアクティビティを取得します。ウォッチしていない場合は404を返却します",
    tags: ["Activities"],
    security: [{ Bearer: [] }],
    request: {
      params: dataSourceParamSchema,
      query: activityListRequestSchema,
    },
    responses: {
      200: {
        description: "データソースのアクティビティ一覧を取得しました",
        content: {
          "application/json": {
            schema: dataSourceActivityListResponseSchema,
          },
        },
      },
      ...activitiesErrorResponseSchemaDefinition,
    },
  })

  app.openapi(listDataSourceActivitiesRoute, async (c) => {
    const authenticated = requireAuth(c)
    const params = c.req.valid("param")
    const query = c.req.valid("query")

    const result = await listDataSourceActivitiesUseCase.execute({
      userId: authenticated.userId,
      dataSourceId: params.dataSourceId,
      page: query.page,
      perPage: query.perPage,
      activityType: query.activityType,
      status: query.status,
      since: query.since ? new Date(query.since) : undefined,
      until: query.until ? new Date(query.until) : undefined,
      sort: query.sort,
      order: query.order,
    })

    if (!result) {
      return c.json(
        {
          success: false,
          error: {
            code: "DATA_SOURCE_NOT_FOUND",
            message: "データソースが見つからないかアクセス権がありません",
          },
        } as const,
        404,
      ) as never
    }

    return c.json(mapDataSourceActivitiesResultToResponse(result), 200)
  })

  return app
}
