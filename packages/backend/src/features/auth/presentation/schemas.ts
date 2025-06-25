import { z } from "@hono/zod-openapi"

/**
 * Auth API Schemas
 * 認証関連APIのZodスキーマ定義
 */

// ユーザー登録リクエスト
export const signUpRequestSchema = z
  .object({
    idToken: z.string().min(1, "IDトークンは必須です").openapi({
      example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6...",
      description: "Auth0から取得したIDトークン",
    }),
  })
  .openapi("SignUpRequest")

// ユーザー情報レスポンス
export const userResponseSchema = z
  .object({
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
    githubUsername: z.string().optional().openapi({
      example: "tanaka-taro",
      description: "GitHubユーザー名（オプション）",
    }),
    avatarUrl: z.string().url().openapi({
      example: "https://avatars.githubusercontent.com/u/12345?v=4",
      description: "アバター画像URL",
    }),
    createdAt: z.string().datetime().openapi({
      example: "2024-01-01T00:00:00.000Z",
      description: "アカウント作成日時（ISO 8601形式）",
    }),
  })
  .openapi("UserResponse")

// ユーザー登録レスポンス
export const signUpResponseSchema = z
  .object({
    user: userResponseSchema,
    message: z.string().openapi({
      example: "ユーザー登録が完了しました",
      description: "処理結果メッセージ",
    }),
    alreadyExists: z.boolean().optional().openapi({
      example: false,
      description: "既存ユーザーの場合はtrue",
    }),
  })
  .openapi("SignUpResponse")

// エラーレスポンス
export const authErrorResponseSchema = z
  .object({
    success: z.boolean().openapi({
      example: false,
      description: "エラー時は常にfalse",
    }),
    error: z
      .object({
        code: z.string().openapi({
          example: "TOKEN_INVALID",
          description: "エラーコード",
        }),
        message: z.string().openapi({
          example: "無効なIDトークンです",
          description: "エラーメッセージ",
        }),
        // （動的な型のためz.any()を使用）
        details: z.any().optional().openapi({
          description: "エラーの詳細情報",
        }),
      })
      .openapi({
        description: "エラー情報",
      }),
  })
  .openapi("AuthErrorResponse")

// 型推論用エクスポート
export type SignUpRequest = z.infer<typeof signUpRequestSchema>
export type UserResponse = z.infer<typeof userResponseSchema>
export type SignUpResponse = z.infer<typeof signUpResponseSchema>
export type AuthErrorResponse = z.infer<typeof authErrorResponseSchema>
