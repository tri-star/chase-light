import { z } from "@hono/zod-openapi"

const activityTypeEnum = z.enum(["release", "issue", "pull_request"]).openapi({
  description: "アクティビティ種別",
  example: "release",
})

const activityStatusEnum = z
  .enum(["pending", "processing", "completed", "failed"])
  .default("completed")
  .openapi({
    description: "アクティビティステータス",
    example: "completed",
  })

const sortFieldEnum = z
  .enum(["createdAt", "updatedAt"])
  .default("createdAt")
  .openapi({
    description: "ソート対象フィールド",
    example: "createdAt",
  })

const sortOrderEnum = z.enum(["asc", "desc"]).default("desc").openapi({
  description: "ソート順",
  example: "desc",
})

const pageSchema = z.coerce.number().int().min(1).default(1).openapi({
  description: "ページ番号 (1始まり)",
  example: 1,
})

const perPageSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .default(20)
  .openapi({
    description: "1ページあたりの件数 (最大100)",
    example: 20,
  })

export const activityListRequestSchema = z
  .object({
    page: pageSchema,
    perPage: perPageSchema,
    activityType: activityTypeEnum.optional(),
    status: activityStatusEnum.optional(),
    since: z.string().datetime().optional().openapi({
      description: "取得期間の開始日時 (ISO8601)",
      example: "2024-01-01T00:00:00.000Z",
    }),
    until: z.string().datetime().optional().openapi({
      description: "取得期間の終了日時 (ISO8601)",
      example: "2024-02-01T00:00:00.000Z",
    }),
    sort: sortFieldEnum,
    order: sortOrderEnum,
    keyword: z.string().min(1).max(100).optional().openapi({
      description: "検索キーワード (部分一致、大文字小文字区別なし)",
      example: "react",
    }),
  })
  .openapi("ActivityListRequest")

export type ActivityListRequest = z.infer<typeof activityListRequestSchema>
