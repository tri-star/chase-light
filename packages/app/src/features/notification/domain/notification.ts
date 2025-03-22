import { z } from 'zod'

const notificationItemSchema = z.object({
  title: z.string(),
  feedLogId: z.string(),
})

export const notificationSchema = z.object({
  id: z.string(),
  createdAt: z.string().or(z.date()),
  title: z.string(),
  notificationItems: z.array(notificationItemSchema),
})
export type Notification = z.infer<typeof notificationSchema>

export const notificationSearchResultSchema = z.object({
  result: z.array(notificationSchema),
  total: z.number(),
})
export type NotificationSearchResult = z.infer<
  typeof notificationSearchResultSchema
>
