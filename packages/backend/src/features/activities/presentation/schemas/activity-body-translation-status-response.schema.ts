import { z } from "@hono/zod-openapi"
import { activityDetailSchema } from "./activity-detail-response.schema"

export const activityBodyTranslationStatusResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      activity: activityDetailSchema,
    }),
  })
  .openapi("ActivityBodyTranslationStatusResponse")

export const activityBodyTranslationStatusErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi("ActivityBodyTranslationStatusErrorResponse")

export type ActivityBodyTranslationStatusResponse = z.infer<
  typeof activityBodyTranslationStatusResponseSchema
>
