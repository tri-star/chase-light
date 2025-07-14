import { z } from "@hono/zod-openapi"
import {
  dataSourceSchema,
  repositorySchema,
  userWatchSchema,
} from "./data-source-response.schema"

/**
 * GitHubリポジトリスキーマ（一覧用）
 * ownerフィールドを追加
 */
export const repositoryListItemSchema = repositorySchema
  .extend({
    owner: z.string().openapi({
      example: "facebook",
      description: "GitHubリポジトリのオーナー名（fullNameから抽出）",
    }),
  })
  .openapi("RepositoryListItem")

/**
 * データソース一覧項目スキーマ
 */
export const dataSourceListItemSchema = z
  .object({
    dataSource: dataSourceSchema,
    repository: repositoryListItemSchema,
    userWatch: userWatchSchema,
  })
  .openapi("DataSourceListItem")

/**
 * ページネーション情報スキーマ
 */
export const paginationSchema = z
  .object({
    page: z.number().int().min(1).openapi({
      example: 1,
      description: "現在のページ番号（1ベース）",
    }),
    perPage: z.number().int().min(1).max(100).openapi({
      example: 20,
      description: "1ページあたりの件数",
    }),
    total: z.number().int().min(0).openapi({
      example: 150,
      description: "総件数",
    }),
    totalPages: z.number().int().min(0).openapi({
      example: 8,
      description: "総ページ数",
    }),
    hasNext: z.boolean().openapi({
      example: true,
      description: "次のページが存在するか",
    }),
    hasPrev: z.boolean().openapi({
      example: false,
      description: "前のページが存在するか",
    }),
  })
  .openapi("Pagination")

/**
 * データソース一覧取得レスポンススキーマ
 */
export const dataSourceListResponseSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: "成功フラグ",
    }),
    data: z
      .object({
        items: z.array(dataSourceListItemSchema).openapi({
          description: "データソース一覧",
        }),
        pagination: paginationSchema.openapi({
          description: "ページネーション情報",
        }),
      })
      .openapi({
        description: "レスポンスデータ",
      }),
  })
  .openapi("DataSourceListResponse")

export type DataSourceListResponse = z.infer<
  typeof dataSourceListResponseSchema
>
export type DataSourceListItem = z.infer<typeof dataSourceListItemSchema>
export type Pagination = z.infer<typeof paginationSchema>
