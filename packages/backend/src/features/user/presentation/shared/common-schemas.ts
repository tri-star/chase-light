import { z } from "@hono/zod-openapi"

/**
 * Users API共通スキーマ
 * ユーザー管理API全体で共通で使用されるスキーマ定義
 */

// ユーザーパラメータ
export const userParams = z
  .object({
    userId: z
      .string()
      .uuid()
      .openapi({
        param: { name: "userId", in: "path" },
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "ユーザーID（UUID）",
      }),
  })
  .openapi("UserParams")

// 共通エラーレスポンス
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

// ユーザー基本情報スキーマ（プロフィール用）
export const userBaseSchema = z.object({
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
})

// 型推論用エクスポート
export type UserParams = z.infer<typeof userParams>
export type UserErrorResponse = z.infer<typeof userErrorResponseSchema>
export type UserBase = z.infer<typeof userBaseSchema>
