import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../identity/middleware/jwt-auth.middleware"
import type {
  GetActivityDetailUseCase,
  GetActivityTranslationStatusUseCase,
  ListUserActivitiesUseCase,
  RequestActivityTranslationUseCase,
} from "../../../application/use-cases"
import {
  activityDetailResponseSchema,
  activityListRequestSchema,
  activityListResponseSchema,
  activitiesErrorResponseSchemaDefinition,
} from "../../schemas"
import {
  translationRequestSchema,
  translationResponseSchema,
  translationStatusResponseSchema,
} from "../../schemas/activity-translation.schema"
import {
  mapActivityDetailToResponse,
  mapListResultToResponse,
} from "../../utils/response-mapper"
import {
  mapTranslationStateToResponse,
  resolveTranslationStatusHttpStatus,
} from "../../utils/translation-response-mapper"

const createApiErrorResponse = (code: string, message: string) => ({
  success: false as const,
  error: { code, message },
})

export function createActivitiesRoutes(
  listUserActivitiesUseCase: ListUserActivitiesUseCase,
  getActivityDetailUseCase: GetActivityDetailUseCase,
  requestActivityTranslationUseCase: RequestActivityTranslationUseCase,
  getActivityTranslationStatusUseCase: GetActivityTranslationStatusUseCase,
) {
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

  const translationRouteParams = z
    .object({
      activityId: z.string().openapi({
        description: "アクティビティID",
        example: "1f2e3d4c-5b6a-7980-1121-314151617181",
      }),
    })
    .openapi("ActivityTranslationParam")

  const requestTranslationRoute = createRoute({
    method: "post",
    path: "/{activityId}/translations/body",
    summary: "アクティビティ本文の翻訳を非同期リクエスト",
    description:
      "ウォッチ済みアクティビティの本文翻訳をSQS経由で非同期実行します。force=falseの場合、進行中ジョブや完了済み翻訳は再投入しません。",
    tags: ["Activities"],
    security: [{ Bearer: [] }],
    request: {
      params: translationRouteParams,
      body: {
        content: {
          "application/json": {
            schema: translationRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description:
          "完了済み翻訳があり、force=falseのため再投入しない場合などに返却",
        content: {
          "application/json": {
            schema: translationResponseSchema,
          },
        },
      },
      202: {
        description: "翻訳ジョブをキューに投入、または進行中ジョブが存在",
        content: {
          "application/json": {
            schema: translationResponseSchema,
          },
        },
      },
      404: {
        description: "アクティビティが存在しない、またはウォッチ外",
        content: {
          "application/json": {
            schema: z
              .object({
                success: z.literal(false),
                error: z.object({
                  code: z.literal("ACTIVITY_NOT_FOUND"),
                  message: z.string(),
                }),
              })
              .openapi("TranslationNotFoundResponse"),
          },
        },
      },
    },
  })

  app.openapi(requestTranslationRoute, async (c) => {
    const authenticated = requireAuth(c)
    const params = c.req.valid("param")
    const body = c.req.valid("json")

    const result = await requestActivityTranslationUseCase.execute({
      userId: authenticated.userId,
      activityId: params.activityId,
      targetLanguage: body.targetLanguage,
      force: body.force,
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

    const status = resolveTranslationStatusHttpStatus(result)
    return c.json(mapTranslationStateToResponse(result), { status })
  })

  const getTranslationStatusRoute = createRoute({
    method: "get",
    path: "/{activityId}/translations/body",
    summary: "アクティビティ本文翻訳ステータス取得",
    description:
      "最新の本文翻訳ステータスを取得します。本文自体は返却しません。",
    tags: ["Activities"],
    security: [{ Bearer: [] }],
    request: {
      params: translationRouteParams,
    },
    responses: {
      200: {
        description: "翻訳ステータス取得成功",
        content: {
          "application/json": {
            schema: translationStatusResponseSchema,
          },
        },
      },
      404: {
        description: "アクティビティが存在しない、またはウォッチ外",
        content: {
          "application/json": {
            schema: z
              .object({
                success: z.literal(false),
                error: z.object({
                  code: z.literal("ACTIVITY_NOT_FOUND"),
                  message: z.string(),
                }),
              })
              .openapi("TranslationStatusNotFoundResponse"),
          },
        },
      },
    },
  })

  app.openapi(getTranslationStatusRoute, async (c) => {
    const authenticated = requireAuth(c)
    const params = c.req.valid("param")

    const result = await getActivityTranslationStatusUseCase.execute({
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

    return c.json(mapTranslationStateToResponse(result), { status: 200 })
  })

  return app
}
