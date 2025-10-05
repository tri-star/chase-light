/**
 * アクティビティ一覧取得リクエストのZodスキーマ
 */

import { z } from "@hono/zod-openapi"

/**
 * アクティビティタイプ
 */
export const ActivityTypeSchema = z.enum(["release", "issue", "pull_request"])

/**
 * アクティビティステータス
 */
export const ActivityStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
])

/**
 * ソート対象フィールド
 */
export const SortBySchema = z.enum(["createdAt", "updatedAt"])

/**
 * ソート順
 */
export const SortOrderSchema = z.enum(["asc", "desc"])

/**
 * クエリパラメータスキーマ
 */
export const ActivityListQuerySchema = z.object({
  activityType: ActivityTypeSchema.optional().openapi({
    description: "アクティビティタイプでのフィルタリング",
    example: "release",
  }),
  status: ActivityStatusSchema.optional().openapi({
    description: "ステータスでのフィルタリング",
    example: "completed",
  }),
  createdAfter: z.string().datetime().optional().openapi({
    description: "この日時以降に作成されたアクティビティを取得（ISO 8601形式）",
    example: "2025-01-01T00:00:00Z",
  }),
  createdBefore: z.string().datetime().optional().openapi({
    description: "この日時以前に作成されたアクティビティを取得（ISO 8601形式）",
    example: "2025-12-31T23:59:59Z",
  }),
  updatedAfter: z.string().datetime().optional().openapi({
    description: "この日時以降に更新されたアクティビティを取得（ISO 8601形式）",
    example: "2025-01-01T00:00:00Z",
  }),
  updatedBefore: z.string().datetime().optional().openapi({
    description: "この日時以前に更新されたアクティビティを取得（ISO 8601形式）",
    example: "2025-12-31T23:59:59Z",
  }),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1))
    .optional()
    .openapi({
      description: "ページ番号（デフォルト: 1）",
      example: "1",
    }),
  perPage: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .openapi({
      description: "1ページあたりの件数（デフォルト: 20、最大: 100）",
      example: "20",
    }),
  sortBy: SortBySchema.optional().default("createdAt").openapi({
    description: "ソート対象フィールド（デフォルト: createdAt）",
    example: "createdAt",
  }),
  sortOrder: SortOrderSchema.optional().default("desc").openapi({
    description: "ソート順（デフォルト: desc）",
    example: "desc",
  }),
})

export type ActivityListQuery = z.infer<typeof ActivityListQuerySchema>
