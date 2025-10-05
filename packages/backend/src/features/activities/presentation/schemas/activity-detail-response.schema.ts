/**
 * アクティビティ詳細取得レスポンスのZodスキーマ
 */

import { z } from "@hono/zod-openapi"
import {
  ActivityTypeSchema,
  ActivityStatusSchema,
} from "./activity-list-request.schema"

/**
 * データソース詳細情報スキーマ
 */
const DataSourceDetailSchema = z.object({
  id: z.string().uuid().openapi({
    description: "データソースID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),
  name: z.string().openapi({
    description: "データソース名",
    example: "facebook/react",
  }),
  description: z.string().openapi({
    description: "データソース説明",
    example:
      "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
  }),
  url: z.string().url().openapi({
    description: "データソースURL",
    example: "https://github.com/facebook/react",
  }),
})

/**
 * アクティビティ詳細スキーマ
 */
const ActivityDetailDataSchema = z.object({
  id: z.string().uuid().openapi({
    description: "アクティビティID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),
  dataSource: DataSourceDetailSchema,
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
  statusDetail: z.string().nullable().openapi({
    description: "ステータス詳細",
    example: null,
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
 * アクティビティ詳細レスポンススキーマ
 */
export const ActivityDetailResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: "成功フラグ",
    example: true,
  }),
  data: ActivityDetailDataSchema,
})

export type ActivityDetailResponse = z.infer<
  typeof ActivityDetailResponseSchema
>
