import { z } from "@hono/zod-openapi"

export const activityBodyTranslationRequestSchema = z
  .object({
    force: z.boolean().optional().openapi({
      description:
        "trueの場合、completedやprocessingでも再翻訳を強制します。デフォルトはfalse。",
      example: false,
    }),
  })
  .openapi("ActivityBodyTranslationRequest")

export const activityBodyTranslationRequestErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi("ActivityBodyTranslationErrorResponse")

export type ActivityBodyTranslationRequest = z.infer<
  typeof activityBodyTranslationRequestSchema
>
