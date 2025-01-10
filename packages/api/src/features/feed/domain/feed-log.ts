import { z } from '@hono/zod-openapi'
import { feedSchema } from './feed'

export const feedLogSchema = z.object({
  id: z.string(),
  feed: feedSchema.omit({ user: true }),
  date: z.date().or(z.string()),
  title: z.string(),
  summary: z.string(),
  body: z.string().optional(),
  url: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type FeedLog = z.infer<typeof feedLogSchema>

export const feedLogSearchResultSchema = z.object({
  result: z.array(feedLogSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export type feedLogSearchResult = z.infer<typeof feedLogSearchResultSchema>
