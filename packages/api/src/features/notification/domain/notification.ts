import type { FeedLogListItemModel } from '@/features/feed/domain/feed-log'
import { z } from 'zod'
import { v7 as uuidv7 } from 'uuid'

export const notificationItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  feedLogId: z.string(),
})

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  read: z.boolean(),
  userId: z.string(),
  notificationItems: z.array(notificationItemSchema),
  createdAt: z.string(),
})
export type Notification = z.infer<typeof notificationSchema>

export const notificationSearchResultSchema = z.object({
  result: z.array(notificationSchema),
  total: z.number(),
})
export type NotificationSearchResult = z.infer<
  typeof notificationSearchResultSchema
>

export function createFeedLogNotification(
  userId: string,
  feedLogs: FeedLogListItemModel[],
): Notification {
  return {
    id: uuidv7(),
    title: '以下の更新がありました。',
    read: false,
    userId,
    notificationItems: feedLogs.map((feedLog) => ({
      id: uuidv7(),
      title: `${feedLog.feed.name} ${feedLog.title}`,
      feedLogId: feedLog.id,
    })),
    createdAt: new Date().toISOString(),
  }
}
