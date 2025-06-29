import { z } from "@hono/zod-openapi"
import { userBaseSchema } from "../../shared/common-schemas"

/**
 * Profile Route Schemas
 * プロフィール管理関連のスキーマ定義
 */

// プロフィール更新リクエスト
export const updateProfileRequestSchema = z
  .object({
    name: z
      .string()
      .min(1, "名前は必須です")
      .max(100, "名前は100文字以内で入力してください")
      .optional()
      .openapi({
        example: "田中太郎",
        description: "ユーザー名",
      }),
    githubUsername: z
      .string()
      .min(1)
      .max(39, "GitHubユーザー名は39文字以内です")
      .optional()
      .openapi({
        example: "tanaka-taro",
        description: "GitHubユーザー名",
      }),
    timezone: z.string().optional().openapi({
      example: "Asia/Tokyo",
      description: "タイムゾーン（IANA形式）",
    }),
  })
  .openapi("UpdateProfileRequest")

// プロフィールレスポンス
export const userProfileResponseSchema = z
  .object({
    user: userBaseSchema,
  })
  .openapi("UserProfileResponse")

// 型推論用エクスポート
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>
