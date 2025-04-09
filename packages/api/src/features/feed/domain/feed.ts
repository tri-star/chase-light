import { datasourceSchema } from '@/features/feed/domain/data-source'
import { userSchema } from '@/features/user/domain/user'
import { makeEnumFromArray, makeUnionFromArray } from '@/lib/utils/zod-utils'
import { z } from '@hono/zod-openapi'
import {
  CYCLE_VALUES,
  MAX_FEED_NAME_LENGTH,
  MAX_FEED_URL_LENGTH,
  SORT_ITEMS_VALUES,
} from 'core/features/feed/feed'
import { SORT_DIRECTION_VALUES } from 'core/constants'

export const feedGitHubMetaSchema = z.object({
  id: z.string(),
  lastReleaseDate: z.date().optional(),
})
export type FeedGitHubMeta = z.infer<typeof feedGitHubMetaSchema>

/**
 * フィードのベースとなるモデル定義
 */
export const feedSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  cycle: makeUnionFromArray(CYCLE_VALUES),
  dataSource: datasourceSchema,
  feedGitHubMeta: feedGitHubMetaSchema.optional(),
  user: userSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Feed = z.infer<typeof feedSchema>

/**
 * 詳細表示用
 */
export const feedDetailModelSchema = feedSchema.extend({
  dataSource: datasourceSchema,
  feedGitHubMeta: feedGitHubMetaSchema.optional(),
  user: userSchema,
})
export type FeedDetailModel = z.infer<typeof feedDetailModelSchema>

/**
 * 登録処理用
 */
export const createFeedRequestSchema = z.object({
  name: z.string().max(MAX_FEED_NAME_LENGTH),
  url: z.string().max(MAX_FEED_URL_LENGTH),
  cycle: makeUnionFromArray(CYCLE_VALUES),
})

export type CreateFeedRequest = z.infer<typeof createFeedRequestSchema>

/**
 * 検索リクエスト
 */
export const feedSearchRequestSchema = z.object({
  keyword: z.string().optional(),
  sort: makeEnumFromArray(SORT_ITEMS_VALUES).optional(),
  sortDirection: makeEnumFromArray(SORT_DIRECTION_VALUES).optional(),
})

/**
 * 検索結果中の1件
 */
export const feedSearchResultItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  cycle: makeUnionFromArray(CYCLE_VALUES),
  dataSource: datasourceSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type feedSearchResult = z.infer<typeof feedSearchResultSchema>

/**
 * 検索結果
 */
export const feedSearchResultSchema = z.object({
  result: z.array(feedSearchResultItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export const validateFeedUrlRequestSchema = z
  .object({
    url: z.string(),
  })
  .openapi({
    example: {
      url: 'https://github.com/some/repo',
    },
  })

export const FEED_VALIDATE_ERROR_DUPLICATE = 'duplicated'
export const FEED_VALIDATE_ERROR_NOT_SUPPORTED = 'not-supported'
export const validateFeedUrlResponseSchema = z.object({
  success: z.boolean(),
  code: makeEnumFromArray([
    FEED_VALIDATE_ERROR_DUPLICATE,
    FEED_VALIDATE_ERROR_NOT_SUPPORTED,
  ]).optional(),
})
export type ValidateFeedUrlResponse = z.infer<
  typeof validateFeedUrlResponseSchema
>

export function isSupportedDataSource(url: string) {
  try {
    const urlObject = new URL(url)
    const hostName = urlObject.hostname

    if (urlObject.protocol !== 'https:') {
      return false
    }
    if (hostName !== 'github.com') {
      return false
    }

    const pathName = urlObject.pathname
    const ownerName = pathName.split('/')[1] ?? undefined
    const repoName = pathName.split('/')[2] ?? undefined

    if (ownerName == null || repoName == null) {
      return false
    }

    if (
      decodeURIComponent(ownerName).trim() === '' ||
      decodeURIComponent(repoName).trim() == ''
    ) {
      return false
    }
  } catch (_e: unknown) {
    return false
  }

  return true
}

/**
 * フィードのURLからデータソースのURLを抽出する
 * @param url
 */
export function extractDataSourceUrl(url: string) {
  //現時点ではGitHubを前提にパースする
  const urlObject = new URL(url)

  const hostName = urlObject.hostname
  const pathName = urlObject.pathname

  const ownerName = pathName.split('/')[1] ?? undefined
  const repoName = pathName.split('/')[2] ?? undefined

  if (ownerName == null || repoName == null) {
    throw new Error(`URLの形式が無効です: ${url}`)
  }

  if (
    decodeURIComponent(ownerName).trim() === '' ||
    decodeURIComponent(repoName).trim() == ''
  ) {
    throw new Error(`URLの形式が無効です: ${url}`)
  }

  const dataSourceUrl = `https://${hostName}/${ownerName}/${repoName}`
  return dataSourceUrl
}

export function tryExtractDataSourceUrl(url: string) {
  try {
    return extractDataSourceUrl(url)
  } catch (_e: unknown) {
    return undefined
  }
}
