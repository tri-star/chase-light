import { feedDetailModelSchema } from '@/features/feed/domain/feed'
import { makeEnumFromArray } from '@/lib/utils/zod-utils'
import { z } from '@hono/zod-openapi'
import { FEED_LOG_STATUS_VALUES } from 'core/features/feed/feed-logs'

export const feedLogSchema = z.object({
  id: z.string(),
  feedId: z.string(),
  key: z.string(),
  date: z.date().or(z.string()),
  title: z.string(),
  summary: z.string(),
  body: z.string().optional(),
  url: z.string(),
  status: makeEnumFromArray(FEED_LOG_STATUS_VALUES),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type FeedLog = z.infer<typeof feedLogSchema>

export const feedLogItemModelSchema = z.object({
  id: z.string(),
  summary: z.string(),
  link: z
    .object({
      title: z.string(),
      url: z.string(),
    })
    .optional(),
})
export type FeedLogItemModel = z.infer<typeof feedLogItemModelSchema>

/**
 * 登録処理用
 */
export const feedLogCreateCommandSchema = z.object({
  id: z.string(),
  feedId: z.string(),
  key: z.string(),
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
  items: z.array(feedLogItemModelSchema),
  status: makeEnumFromArray(FEED_LOG_STATUS_VALUES),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type FeedLogListItemModel = z.infer<typeof feedLogListItemModelSchema>

export const feedLogListSearchRequestCommandSchema = z.object({
  page: z.string().optional(),
  pageSize: z.string(),
})

export const feedLogSearchResultModelSchema = z.object({
  result: z.array(feedLogListItemModelSchema),
  total: z.number(),
})

export type FeedLogSearchResultModel = z.infer<
  typeof feedLogSearchResultModelSchema
>
