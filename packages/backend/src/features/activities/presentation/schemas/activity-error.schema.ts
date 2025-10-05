import { z } from "@hono/zod-openapi"

export const activitiesErrorResponseSchema = z
  .object({
    success: z.literal(false).openapi({
      description: "成功フラグ (常にfalse)",
      example: false,
    }),
    error: z
      .object({
        code: z.string().openapi({
          description: "エラーコード",
          example: "ACTIVITY_NOT_FOUND",
        }),
        message: z.string().openapi({
          description: "エラーメッセージ",
          example: "指定されたアクティビティが見つかりません",
        }),
        details: z.any().optional().openapi({
          description: "詳細情報",
        }),
      })
      .openapi({
        description: "エラー情報",
      }),
  })
  .openapi("ActivitiesErrorResponse")

export const activitiesErrorResponseSchemaDefinition = {
  400: {
    description: "バリデーションエラー",
    content: {
      "application/json": {
        schema: activitiesErrorResponseSchema,
      },
    },
  },
  401: {
    description: "認証エラー",
    content: {
      "application/json": {
        schema: activitiesErrorResponseSchema,
      },
    },
  },
  404: {
    description: "リソースが見つからない / アクセス権なし",
    content: {
      "application/json": {
        schema: activitiesErrorResponseSchema,
      },
    },
  },
} as const

export type ActivitiesErrorResponse = z.infer<
  typeof activitiesErrorResponseSchema
>
