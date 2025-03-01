import { z } from 'zod'
import { feedSchema } from '~/features/feed/domain/feed'

export const feedLogItemSchema = z.object({
  id: z.string(),
  summary: z.string(),
  link: z
    .object({
      title: z.string(),
      url: z.string(),
    })
    .optional(),
})

export const feedLogSchema = z.object({
  id: z.string(),
  feed: feedSchema,
  date: z.union([z.date(), z.string()]),
  title: z.string(),
  summary: z.string(),
  body: z.string().optional(),
  url: z.string(),
  items: z.array(feedLogItemSchema),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
})
export type FeedLog = z.infer<typeof feedLogSchema>

/**
 * 一覧表示用
 */
export const feedLogListItemModelSchema = z.object({
  id: z.string(),
  feed: z.object({
    id: z.string(),
    name: z.string(),
  }),
  date: z.union([z.date(), z.string()]),
  title: z.string(),
  summary: z.string(),
  url: z.string(),
  items: z.array(feedLogItemSchema),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
})
export type FeedLogListItemModel = z.infer<typeof feedLogListItemModelSchema>
