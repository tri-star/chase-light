import { z } from "@hono/zod-openapi"

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

export type UserBase = z.infer<typeof userBaseSchema>
