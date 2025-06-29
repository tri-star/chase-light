import { z } from "@hono/zod-openapi"

/**
 * Settings Route Schemas
 * 設定管理関連のスキーマ定義
 */

// 設定更新リクエスト
export const updateSettingsRequestSchema = z
  .object({
    timezone: z.string().optional().openapi({
      example: "Asia/Tokyo",
      description: "タイムゾーン（IANA形式）",
    }),
    emailNotifications: z.boolean().optional().openapi({
      example: true,
      description: "メール通知の有効/無効",
    }),
    pushNotifications: z.boolean().optional().openapi({
      example: false,
      description: "プッシュ通知の有効/無効",
    }),
    language: z.string().optional().openapi({
      example: "ja",
      description: "表示言語（ja/en）",
    }),
  })
  .openapi("UpdateSettingsRequest")

// 設定レスポンス
export const userSettingsResponseSchema = z
  .object({
    settings: z.object({
      timezone: z.string().openapi({
        example: "Asia/Tokyo",
        description: "タイムゾーン",
      }),
      emailNotifications: z.boolean().openapi({
        example: true,
        description: "メール通知の有効/無効",
      }),
      pushNotifications: z.boolean().openapi({
        example: false,
        description: "プッシュ通知の有効/無効",
      }),
      language: z.string().openapi({
        example: "ja",
        description: "表示言語",
      }),
    }),
  })
  .openapi("UserSettingsResponse")

// 型推論用エクスポート
export type UpdateSettingsRequest = z.infer<typeof updateSettingsRequestSchema>
export type UserSettingsResponse = z.infer<typeof userSettingsResponseSchema>
