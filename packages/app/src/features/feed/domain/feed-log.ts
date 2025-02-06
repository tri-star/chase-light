import { z } from 'zod'
import { feedSchema } from '~/features/feed/domain/feed'

export const feedLogSchema = z.object({
  id: z.string(),
  feed: feedSchema,
  date: z.date().or(z.string()),
  title: z.string(),
  summary: z.string(),
  body: z.string().optional(),
  url: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
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
  date: z.date().or(z.string()),
  title: z.string(),
  summary: z.string(),
  url: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type FeedLogListItemModel = z.infer<typeof feedLogListItemModelSchema>
