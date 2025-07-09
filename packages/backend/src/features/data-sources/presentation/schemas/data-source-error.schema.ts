import { z } from "@hono/zod-openapi"

/**
 * エラーレスポンスの詳細情報スキーマ
 */
export const errorDetailsSchema = z
  .object({
    field: z.string().optional().openapi({
      example: "repositoryUrl",
      description: "エラーが発生したフィールド名",
    }),
    value: z.string().optional().openapi({
      example: "invalid-url",
      description: "エラーが発生した値",
    }),
  })
  .openapi("ErrorDetails")

/**
 * エラーレスポンススキーマ
 */
export const dataSourceErrorSchema = z
  .object({
    success: z.boolean().openapi({
      example: false,
      description: "成功フラグ（常にfalse）",
    }),
    error: z
      .object({
        code: z.string().openapi({
          example: "INVALID_REPOSITORY_URL",
          description: "エラーコード",
        }),
        message: z.string().openapi({
          example: "無効なGitHubリポジトリURLです",
          description: "エラーメッセージ",
        }),
        details: errorDetailsSchema.optional().openapi({
          description: "エラーの詳細情報",
        }),
      })
      .openapi({
        description: "エラー情報",
      }),
  })
  .openapi("DataSourceError")

/**
 * データソース関連のエラーレスポンス定義
 */
export const dataSourceErrorResponseSchemaDefinition = {
  400: {
    content: {
      "application/json": {
        schema: dataSourceErrorSchema,
      },
    },
    description: "バリデーションエラー、無効なリクエスト",
  },
  401: {
    content: {
      "application/json": {
        schema: dataSourceErrorSchema,
      },
    },
    description: "認証エラー",
  },
  404: {
    content: {
      "application/json": {
        schema: dataSourceErrorSchema,
      },
    },
    description: "リポジトリが見つからない",
  },
  409: {
    content: {
      "application/json": {
        schema: dataSourceErrorSchema,
      },
    },
    description: "重複エラー（リポジトリが既に登録済み）",
  },
  500: {
    content: {
      "application/json": {
        schema: dataSourceErrorSchema,
      },
    },
    description: "サーバーエラー",
  },
}
