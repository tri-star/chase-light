import { z } from "@hono/zod-openapi"
import { notificationListItemSchema } from "./notification-list-response.schema"

export const notificationDetailResponseSchema = z
  .object({
    success: z.literal(true).openapi({
      example: true,
    }),
    data: z.object({
      item: notificationListItemSchema,
    }),
  })
  .openapi("NotificationDetailResponse")
