import { z } from "@hono/zod-openapi"

/**
 * ソート基準の定義
 */
export const sortBySchema = z
  .enum(["name", "createdAt", "updatedAt", "addedAt", "starsCount"])
  .default("createdAt")
  .openapi({
    description: "ソート基準",
    example: "createdAt",
  })

/**
 * ソート順の定義
 */
export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc").openapi({
  description: "ソート順（昇順・降順）",
  example: "desc",
})

/**
 * ページネーションのページ番号
 */
export const pageSchema = z.coerce.number().int().min(1).default(1).openapi({
  description: "ページ番号（1ベース）",
  example: 1,
})

/**
 * ページネーションの1ページあたりの件数
 */
export const perPageSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .default(20)
  .openapi({
    description: "1ページあたりの件数（1-100）",
    example: 20,
  })

/**
 * データソース一覧取得のクエリパラメータスキーマ
 */
export const dataSourceListRequestSchema = z
  .object({
    // 検索・フィルタリング
    name: z.string().optional().openapi({
      description: "データソース名での部分一致検索",
      example: "React",
    }),
    owner: z.string().optional().openapi({
      description: "GitHubオーナー名での部分一致検索",
      example: "facebook",
    }),
    search: z.string().optional().openapi({
      description: "フリーワード検索（name, description, url, fullName対象）",
      example: "javascript library",
    }),
    sourceType: z.string().optional().openapi({
      description: "データソースタイプでの絞り込み",
      example: "github",
    }),
    isPrivate: z.coerce.boolean().optional().openapi({
      description: "プライベート/パブリック絞り込み",
      example: false,
    }),
    language: z.string().optional().openapi({
      description: "プログラミング言語での絞り込み",
      example: "JavaScript",
    }),
    createdAfter: z.string().datetime().optional().openapi({
      description: "登録日（これ以降）ISO8601形式",
      example: "2024-01-01T00:00:00.000Z",
    }),
    createdBefore: z.string().datetime().optional().openapi({
      description: "登録日（これ以前）ISO8601形式",
      example: "2024-12-31T23:59:59.999Z",
    }),
    updatedAfter: z.string().datetime().optional().openapi({
      description: "更新日（これ以降）ISO8601形式",
      example: "2024-01-01T00:00:00.000Z",
    }),
    updatedBefore: z.string().datetime().optional().openapi({
      description: "更新日（これ以前）ISO8601形式",
      example: "2024-12-31T23:59:59.999Z",
    }),

    // ソート
    sortBy: sortBySchema,
    sortOrder: sortOrderSchema,

    // ページネーション
    page: pageSchema,
    perPage: perPageSchema,
  })
  .openapi("DataSourceListRequest")

export type DataSourceListRequest = z.infer<typeof dataSourceListRequestSchema>
