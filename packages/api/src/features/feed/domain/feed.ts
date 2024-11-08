import { datasourceSchema } from "@/features/feed/domain/data-source"
import { userSchema } from "@/features/user/domain/user"
import { makeUnionFromArray } from "@/lib/utils/zod-utils"
import { z } from "@hono/zod-openapi"
import { CYCLE_VALUES } from "core/features/feed/feed"

export const feedSchema = z.object({
  id: z.string(),
  name: z.string(),
  cycle: makeUnionFromArray(CYCLE_VALUES),
  dataSource: datasourceSchema,
  user: userSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Feed = z.infer<typeof feedSchema>

export const createFeedRequestSchema = z.object({
  name: z.string(),
  url: z.string(),
  cycle: makeUnionFromArray(CYCLE_VALUES),
})

export type CreateFeedRequest = z.infer<typeof createFeedRequestSchema>

export const feedSearchResultItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  cycle: makeUnionFromArray(CYCLE_VALUES),
  dataSource: datasourceSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type feedSearchResult = z.infer<typeof feedSearchResultSchema>

export const feedSearchResultSchema = z.object({
  result: z.array(feedSearchResultItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
