import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../identity/middleware/jwt-auth.middleware"
import type {
  GetActivityBodyTranslationStatusUseCase,
  RequestActivityBodyTranslationUseCase,
} from "../../../application"
import {
  activityBodyTranslationRequestSchema,
  activityBodyTranslationRequestErrorResponseSchema,
} from "../../schemas/activity-body-translation-request.schema"
import {
  activityBodyTranslationStatusResponseSchema,
  activityBodyTranslationStatusErrorResponseSchema,
} from "../../schemas/activity-body-translation-status-response.schema"
import { mapActivityDetailToResponse } from "../../utils/response-mapper"
import type { Activity, ActivityDetail } from "../../../domain"

const createApiErrorResponse = (code: string, message: string) => ({
  success: false as const,
  error: { code, message },
})

export function createActivityBodyTranslationRoutes(
  requestUseCase: RequestActivityBodyTranslationUseCase,
  statusUseCase: GetActivityBodyTranslationStatusUseCase,
) {
  const app = new OpenAPIHono()

  const activityIdParamSchema = z
    .object({
      activityId: z.string().openapi({
        description: "アクティビティID",
        example: "1f2e3d4c-5b6a-7980-1121-314151617181",
      }),
    })
    .openapi("ActivityIdParamForTranslation")

  const requestRoute = createRoute({
    method: "post",
    path: "/{activityId}/translation/body",
    summary: "アクティビティ本文翻訳のリクエスト",
    description:
      "ウォッチしているアクティビティ本文の翻訳をリクエストします。force=trueで再翻訳を強制できます。",
    tags: ["Activities"],
    security: [{ Bearer: [] }],
    request: {
      params: activityIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: activityBodyTranslationRequestSchema,
          },
        },
      },
    },
    responses: {
      202: {
        description: "翻訳リクエストを受理しました",
        content: {
          "application/json": {
            schema: activityBodyTranslationStatusResponseSchema,
          },
        },
      },
      200: {
        description: "既に翻訳済みの結果を返却",
        content: {
          "application/json": {
            schema: activityBodyTranslationStatusResponseSchema,
          },
        },
      },
      409: {
        description: "翻訳処理中のため衝突",
        content: {
          "application/json": {
            schema: activityBodyTranslationRequestErrorResponseSchema,
          },
        },
      },
      404: {
        description: "対象が見つからない、またはウォッチしていない",
        content: {
          "application/json": {
            schema: activityBodyTranslationRequestErrorResponseSchema,
          },
        },
      },
    },
  })

  app.openapi(requestRoute, async (c) => {
    const auth = requireAuth(c)
    const { activityId } = c.req.valid("param")
    const body = c.req.valid("json")

    const result = await requestUseCase.execute({
      userId: auth.userId,
      activityId,
      force: body?.force ?? false,
    })

    if (result.status === "not_found") {
      return c.json(
        createApiErrorResponse(
          "ACTIVITY_NOT_FOUND",
          "アクティビティが見つからないかアクセス権がありません",
        ),
        404,
      ) as never
    }

    if (result.status === "conflict") {
      return c.json(
        createApiErrorResponse(
          "BODY_TRANSLATION_IN_PROGRESS",
          "本文翻訳が進行中のため新規リクエストを受け付けられません",
        ),
        409,
      ) as never
    }

    if (result.status === "already_completed") {
      return c.json(
        mapActivityDetailToResponse(toActivityDetail(result.activity)),
        200,
      )
    }

    return c.json(
      mapActivityDetailToResponse(toActivityDetail(result.activity)),
      202,
    )
  })

  const statusRoute = createRoute({
    method: "get",
    path: "/{activityId}/translation/body/status",
    summary: "アクティビティ本文翻訳の進行状況取得",
    description: "本文翻訳の状態とタイムスタンプ、翻訳済み本文を返却します",
    tags: ["Activities"],
    security: [{ Bearer: [] }],
    request: {
      params: activityIdParamSchema,
    },
    responses: {
      200: {
        description: "状態取得に成功",
        content: {
          "application/json": {
            schema: activityBodyTranslationStatusResponseSchema,
          },
        },
      },
      404: {
        description: "対象が見つからない、またはウォッチしていない",
        content: {
          "application/json": {
            schema: activityBodyTranslationStatusErrorResponseSchema,
          },
        },
      },
    },
  })

  app.openapi(statusRoute, async (c) => {
    const auth = requireAuth(c)
    const { activityId } = c.req.valid("param")

    const result = await statusUseCase.execute({
      userId: auth.userId,
      activityId,
    })

    if (result.status === "not_found") {
      return c.json(
        createApiErrorResponse(
          "ACTIVITY_NOT_FOUND",
          "アクティビティが見つからないかアクセス権がありません",
        ),
        404,
      ) as never
    }

    return c.json(
      mapActivityDetailToResponse(toActivityDetail(result.activity)),
      200,
    )
  })

  return app
}

function toActivityDetail(activity: Activity): ActivityDetail {
  return {
    activity: {
      id: activity.id,
      activityType: activity.activityType,
      title: activity.title,
      translatedTitle: activity.translatedTitle,
      summary: activity.summary,
      detail: activity.body,
      translatedBody: activity.translatedBody,
      bodyTranslationStatus: activity.bodyTranslationStatus,
      bodyTranslationRequestedAt: activity.bodyTranslationRequestedAt,
      bodyTranslationStartedAt: activity.bodyTranslationStartedAt,
      bodyTranslationCompletedAt: activity.bodyTranslationCompletedAt,
      bodyTranslationError: activity.bodyTranslationError,
      status: activity.status,
      statusDetail: activity.statusDetail,
      version: activity.version,
      occurredAt: activity.createdAt,
      lastUpdatedAt: activity.updatedAt,
      source: {
        id: activity.dataSourceId,
        sourceType: "github_repository",
        name: "",
        url: "",
      },
    },
  }
}
