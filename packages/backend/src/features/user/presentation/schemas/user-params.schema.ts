import { z } from "@hono/zod-openapi"

/**
 * User Params Schema
 * ユーザー関連のパラメータ共通スキーマ定義
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

// 型推論用エクスポート
export type UserParams = z.infer<typeof userParams>
