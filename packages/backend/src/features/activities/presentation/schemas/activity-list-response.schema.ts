/**
 * アクティビティ一覧取得レスポンスのZodスキーマ
 */

import { z } from "@hono/zod-openapi"
import {
  ActivityTypeSchema,
  ActivityStatusSchema,
} from "./activity-list-request.schema"

/**
 * データソース情報スキーマ（一覧用）
 */
const DataSourceInfoSchema = z.object({
  id: z.string().uuid().openapi({
    description: "データソースID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),
  name: z.string().openapi({
    description: "データソース名",
    example: "facebook/react",
  }),
  url: z.string().url().openapi({
    description: "データソースURL",
    example: "https://github.com/facebook/react",
  }),
})

/**
 * アクティビティ項目スキーマ
 */
const ActivityItemSchema = z.object({
  id: z.string().uuid().openapi({
    description: "アクティビティID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),
  dataSource: DataSourceInfoSchema,
  activityType: ActivityTypeSchema.openapi({
    description: "アクティビティタイプ",
    example: "release",
  }),
  title: z.string().openapi({
    description: "タイトル",
    example: "v18.3.0",
  }),
  body: z.string().openapi({
    description: "本文",
    example: "新機能の追加とバグ修正が含まれています。",
  }),
  version: z.string().nullable().openapi({
    description: "バージョン（リリースの場合のみ）",
    example: "18.3.0",
  }),
  status: ActivityStatusSchema.openapi({
    description: "ステータス",
    example: "completed",
  }),
  createdAt: z.string().datetime().openapi({
    description: "作成日時（ISO 8601形式）",
    example: "2025-01-01T00:00:00Z",
  }),
  updatedAt: z.string().datetime().openapi({
    description: "更新日時（ISO 8601形式）",
    example: "2025-01-01T00:00:00Z",
  }),
})

/**
 * ページネーション情報スキーマ
 */
const PaginationInfoSchema = z.object({
  currentPage: z.number().int().min(1).openapi({
    description: "現在のページ番号",
    example: 1,
  }),
  perPage: z.number().int().min(1).max(100).openapi({
    description: "1ページあたりの件数",
    example: 20,
  }),
  totalItems: z.number().int().min(0).openapi({
    description: "総件数",
    example: 100,
  }),
  totalPages: z.number().int().min(0).openapi({
    description: "総ページ数",
    example: 5,
  }),
})

/**
 * アクティビティ一覧レスポンススキーマ
 */
export const ActivityListResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: "成功フラグ",
    example: true,
  }),
  data: z.object({
    items: z.array(ActivityItemSchema).openapi({
      description: "アクティビティ一覧",
    }),
    pagination: PaginationInfoSchema.openapi({
      description: "ページネーション情報",
    }),
  }),
})

export type ActivityListResponse = z.infer<typeof ActivityListResponseSchema>
