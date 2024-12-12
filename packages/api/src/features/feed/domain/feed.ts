import { datasourceSchema } from "@/features/feed/domain/data-source"
import { userSchema } from "@/features/user/domain/user"
import { makeEnumFromArray, makeUnionFromArray } from "@/lib/utils/zod-utils"
import { z } from "@hono/zod-openapi"
import { CYCLE_VALUES, SORT_ITEMS_VALUES } from "core/features/feed/feed"
import { SORT_DIRECTION_VALUES } from "core/constants"

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

export const feedSearchRequestSchema = z.object({
  keyword: z.string().optional(),
  sort: makeEnumFromArray(SORT_ITEMS_VALUES).optional(),
  sortDirection: makeEnumFromArray(SORT_DIRECTION_VALUES).optional(),
})

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

/**
 * フィードのURLからデータソースのURLを抽出する
 * @param url
 */
export function extractDataSourceUrl(url: string) {
  //現時点ではGitHubを前提にパースする
  const urlObject = new URL(url)

  const hostName = urlObject.hostname
  const pathName = urlObject.pathname

  const ownerName = pathName.split("/")[1] ?? undefined
  const repoName = pathName.split("/")[2] ?? undefined

  const dataSourceUrl = `https://${hostName}${ownerName}/${repoName}`
  return dataSourceUrl
}
