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
    translatedTitle: z.string().nullable().openapi({
      description: "翻訳済みタイトル (日本語)",
      example: "重大なバグ修正",
    }),
    summary: z.string().nullable().openapi({
      description: "本文の要約 (翻訳済み)",
      example: "メモリリークを修正しました",
    }),
    detail: z.string().openapi({
      description: "表示用の詳細本文 (原文)",
      example: "## 修正内容\n- メモリリークの修正\n- テストの追加",
    }),
    translatedBody: z.string().nullable().openapi({
      description: "翻訳済み本文 (現状はnull)",
      example: null,
    }),
    bodyTranslationStatus: z
      .enum(["not_requested", "pending", "processing", "completed", "failed"])
      .openapi({
        description: "本文翻訳の進行状況",
        example: "pending",
      }),
    bodyTranslationRequestedAt: z.string().datetime().nullable().openapi({
      description: "本文翻訳がリクエストされた日時",
      example: "2024-01-02T12:00:00.000Z",
    }),
    bodyTranslationStartedAt: z.string().datetime().nullable().openapi({
      description: "本文翻訳が開始された日時",
      example: "2024-01-02T12:05:00.000Z",
    }),
    bodyTranslationCompletedAt: z.string().datetime().nullable().openapi({
      description: "本文翻訳が完了した日時",
      example: "2024-01-02T12:06:00.000Z",
    }),
    bodyTranslationError: z.string().nullable().openapi({
      description: "本文翻訳で発生したエラー内容",
      example: null,
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
