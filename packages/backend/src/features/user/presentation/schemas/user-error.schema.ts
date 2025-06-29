import { z } from "@hono/zod-openapi"

/**
 * User Error Schema
 * ユーザー関連のエラーレスポンス共通スキーマ定義
 */

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

// 型推論用エクスポート
export type UserErrorResponse = z.infer<typeof userErrorResponseSchema>
