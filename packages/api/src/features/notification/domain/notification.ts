import { z } from 'zod'

export const notificationItemSchema = z.object({
  id: z.string(),
  title: z.string(),
})

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
})

export const notificationSearchResultSchema = z.object({
  result: z.array(notificationSchema),
  total: z.number(),
})
export type NotificationSearchResult = z.infer<
  typeof notificationSearchResultSchema
>
