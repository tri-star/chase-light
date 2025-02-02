import { feedDetailModelSchema } from '@/features/feed/domain/feed'
import { z } from '@hono/zod-openapi'

export const feedLogSchema = z.object({
  id: z.string(),
  feedId: z.string(),
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
 * 登録処理用
 */
export const feedLogCreateCommandSchema = z.object({
  id: z.string(),
  feedId: z.string(),
  date: z.date().or(z.string()),
  title: z.string(),
  url: z.string(),
})
export type FeedLogCreateCommand = z.infer<typeof feedLogCreateCommandSchema>

/**
 * 詳細表示用
 */
export const feedLogDetailModelSchema = feedLogSchema.extend({
  feed: feedDetailModelSchema,
})
export type FeedLogDetailModel = z.infer<typeof feedLogDetailModelSchema>

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

export const feedLogSearchResultModelSchema = z.object({
  result: z.array(feedLogSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export type FeedLogSearchResultModel = z.infer<
  typeof feedLogSearchResultModelSchema
>
