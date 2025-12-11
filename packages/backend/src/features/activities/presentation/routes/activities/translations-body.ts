import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../identity/middleware/jwt-auth.middleware"
import type {
  GetActivityTranslationStatusUseCase,
  RequestActivityTranslationUseCase,
} from "../../../application/use-cases"
import {
  translationRequestSchema,
  translationResponseSchema,
  translationStatusResponseSchema,
} from "../../schemas/activity-translation.schema"
import {
  mapTranslationStateToResponse,
  resolveTranslationStatusHttpStatus,
} from "../../utils/translation-response-mapper"

const createApiErrorResponse = (code: string, message: string) => ({
  success: false as const,
  error: { code, message },
})

const translationRouteParams = z
  .object({
    activityId: z.string().openapi({
      description: "アクティビティID",
      example: "1f2e3d4c-5b6a-7980-1121-314151617181",
    }),
  })
  .openapi("ActivityTranslationParam")

export function createActivityTranslationsBodyRoutes(
  requestActivityTranslationUseCase: RequestActivityTranslationUseCase,
  getActivityTranslationStatusUseCase: GetActivityTranslationStatusUseCase,
) {
  const app = new OpenAPIHono()

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
