import { z } from "@hono/zod-openapi"
import { ACTIVITY_BODY_TRANSLATION_STATUS } from "../../domain"

export const translationRequestSchema = z
  .object({
    force: z.boolean().optional().openapi({
      description:
        "true の場合、終端ステータスでも再翻訳を許可。省略時は完了済みなら再キューしない。",
    }),
    targetLanguage: z
      .enum(["ja"])
      .optional()
      .openapi({ description: "翻訳対象言語。省略時は ja 固定。" }),
  })
  .openapi("TranslationRequest")

export const translationStatusSchema = z
  .enum([
    ACTIVITY_BODY_TRANSLATION_STATUS.QUEUED,
    ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING,
    ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED,
    ACTIVITY_BODY_TRANSLATION_STATUS.FAILED,
  ])
  .openapi("TranslationStatus")

export const translationStateSchema = z
  .object({
    jobId: z
      .string()
      .nullable()
      .openapi({ description: "SQS MessageId等のジョブ識別子" }),
    translationStatus: translationStatusSchema,
    statusDetail: z.string().nullable(),
    requestedAt: z.string().datetime(),
    startedAt: z.string().datetime().nullable(),
    completedAt: z.string().datetime().nullable(),
  })
  .openapi("TranslationState")

export const translationResponseSchema = z
  .object({
    success: z.literal(true),
    data: translationStateSchema,
  })
  .openapi("TranslationResponse")

export const translationStatusResponseSchema = z
  .object({
    success: z.literal(true),
    data: translationStateSchema,
  })
  .openapi("TranslationStatusResponse")
