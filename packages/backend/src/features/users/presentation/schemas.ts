import { z } from "@hono/zod-openapi"

/**
 * User API Schemas
 * ユーザー管理関連APIのZodスキーマ定義
 */

// ユーザープロフィール更新リクエスト
export const updateProfileRequestSchema = z
  .object({
    name: z.string().min(1, "名前は必須です").max(100, "名前は100文字以内で入力してください").optional().openapi({
      example: "田中太郎",
      description: "ユーザー名",
    }),
    githubUsername: z.string().min(1).max(39, "GitHubユーザー名は39文字以内です").optional().openapi({
      example: "tanaka-taro",
      description: "GitHubユーザー名",
    }),
    timezone: z.string().optional().openapi({
      example: "Asia/Tokyo",
      description: "タイムゾーン（IANA形式）",
    }),
  })
  .openapi("UpdateProfileRequest")

// ユーザープロフィールレスポンス
export const userProfileResponseSchema = z
  .object({
    user: z.object({
      id: z.string().uuid().openapi({
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "ユーザーID（UUID）",
      }),
      email: z.string().email().openapi({
        example: "user@example.com",
        description: "メールアドレス",
      }),
      name: z.string().openapi({
        example: "田中太郎",
        description: "ユーザー名",
      }),
      githubUsername: z.string().nullable().openapi({
        example: "tanaka-taro",
        description: "GitHubユーザー名（オプション）",
      }),
      avatarUrl: z.string().url().openapi({
        example: "https://avatars.githubusercontent.com/u/12345?v=4",
        description: "アバター画像URL",
      }),
      timezone: z.string().openapi({
        example: "Asia/Tokyo",
        description: "タイムゾーン",
      }),
      createdAt: z.string().datetime().openapi({
        example: "2024-01-01T00:00:00.000Z",
        description: "アカウント作成日時（ISO 8601形式）",
      }),
      updatedAt: z.string().datetime().openapi({
        example: "2024-01-01T00:00:00.000Z",
        description: "最終更新日時（ISO 8601形式）",
      }),
    }),
  })
  .openapi("UserProfileResponse")

// ユーザー設定更新リクエスト
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

// ユーザー設定レスポンス
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

// エラーレスポンス
export const userErrorResponseSchema = z
  .object({
    success: z.boolean().openapi({
      example: false,
      description: "エラー時は常にfalse",
    }),
    error: z
      .object({
        code: z.string().openapi({
          example: "USER_NOT_FOUND",
          description: "エラーコード",
        }),
        message: z.string().openapi({
          example: "ユーザーが見つかりません",
          description: "エラーメッセージ",
        }),
        details: z.any().optional().openapi({
          description: "エラーの詳細情報",
        }),
      })
      .openapi({
        description: "エラー情報",
      }),
  })
  .openapi("UserErrorResponse")

// 型推論用エクスポート
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>
export type UpdateSettingsRequest = z.infer<typeof updateSettingsRequestSchema>
export type UserSettingsResponse = z.infer<typeof userSettingsResponseSchema>
export type UserErrorResponse = z.infer<typeof userErrorResponseSchema>