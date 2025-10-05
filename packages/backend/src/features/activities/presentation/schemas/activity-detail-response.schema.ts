import { z } from "@hono/zod-openapi"
import { activitySourceSchema } from "./activity-list-response.schema"

export const activityDetailSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "アクティビティID",
      example: "1f2e3d4c-5b6a-7980-1121-314151617181",
    }),
    activityType: z
      .enum(["release", "issue", "pull_request"])
      .openapi({ description: "アクティビティ種別", example: "issue" }),
    title: z.string().openapi({
      description: "アクティビティのタイトル",
      example: "Critical bug fix",
    }),
    summary: z.string().nullable().openapi({
      description: "本文からのサマリ",
      example: "メモリリークを修正しました",
    }),
    detail: z.string().openapi({
      description: "表示用の詳細本文",
      example: "## 修正内容\n- メモリリークの修正\n- テストの追加",
    }),
    status: z
      .enum(["pending", "processing", "completed", "failed"])
      .openapi({ description: "処理ステータス", example: "completed" }),
    statusDetail: z.string().nullable().openapi({
      description: "ステータスに関する補足",
      example: null,
    }),
    version: z.string().nullable().openapi({
      description: "リリースバージョン",
      example: "v1.2.0",
    }),
    occurredAt: z.string().datetime().openapi({
      description: "発生日時",
      example: "2024-01-02T12:00:00.000Z",
    }),
    lastUpdatedAt: z.string().datetime().openapi({
      description: "最終更新日時",
      example: "2024-01-02T12:30:00.000Z",
    }),
    source: activitySourceSchema,
  })
  .openapi("ActivityDetail")

export const activityDetailResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      activity: activityDetailSchema,
    }),
  })
  .openapi("ActivityDetailResponse")

export type ActivityDetailResponse = z.infer<
  typeof activityDetailResponseSchema
>
