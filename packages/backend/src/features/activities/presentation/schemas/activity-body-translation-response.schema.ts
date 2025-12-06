import { z } from "@hono/zod-openapi"
import { activityDetailSchema } from "./activity-detail-response.schema"

export const activityBodyTranslationResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      activity: activityDetailSchema,
    }),
  })
  .openapi("ActivityBodyTranslationResponse")

export const activityBodyTranslationErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi("ActivityBodyTranslationErrorResponse")

export type ActivityBodyTranslationResponse = z.infer<
  typeof activityBodyTranslationResponseSchema
>
