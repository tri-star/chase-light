import { z } from "@hono/zod-openapi"

/**
 * リポジトリレスポンススキーマ（基本版）
 */
export const repositoryBaseSchema = z
  .object({
    id: z.string().openapi({
      example: "01234567-89ab-cdef-0123-456789abcdef",
      description: "リポジトリID",
    }),
    dataSourceId: z.string().openapi({
      example: "01234567-89ab-cdef-0123-456789abcdef",
      description: "データソースID",
    }),
    githubId: z.number().openapi({
      example: 10270250,
      description: "GitHub リポジトリID",
    }),
    fullName: z.string().openapi({
      example: "facebook/react",
      description: "リポジトリのフルネーム",
    }),
    language: z.string().nullable().openapi({
      example: "JavaScript",
      description: "主要プログラミング言語",
    }),
    starsCount: z.number().openapi({
      example: 230000,
      description: "スター数",
    }),
    forksCount: z.number().openapi({
      example: 47000,
      description: "フォーク数",
    }),
    openIssuesCount: z.number().openapi({
      example: 1500,
      description: "未解決イシュー数",
    }),
    isFork: z.boolean().openapi({
      example: false,
      description: "フォークリポジトリかどうか",
    }),
    createdAt: z.string().openapi({
      example: "2024-07-08T10:00:00.000Z",
      description: "作成日時",
    }),
    updatedAt: z.string().openapi({
      example: "2024-07-08T10:00:00.000Z",
      description: "更新日時",
    }),
  })
  .openapi("Repository")

/**
 * データソースレスポンススキーマ（repository内包形式）
 */
export const dataSourceSchema = z
  .object({
    id: z.string().openapi({
      example: "01234567-89ab-cdef-0123-456789abcdef",
      description: "データソースID",
    }),
    sourceType: z.string().openapi({
      example: "github",
      description: "データソースタイプ",
    }),
    sourceId: z.string().openapi({
      example: "123456789",
      description: "外部サービスでのID",
    }),
    name: z.string().openapi({
      example: "React",
      description: "データソース名",
    }),
    description: z.string().openapi({
      example:
        "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
      description: "データソースの説明",
    }),
    url: z.string().openapi({
      example: "https://github.com/facebook/react",
      description: "データソースのURL",
    }),
    isPrivate: z.boolean().openapi({
      example: false,
      description: "プライベートリポジトリかどうか",
    }),
    createdAt: z.string().openapi({
      example: "2024-07-08T10:00:00.000Z",
      description: "作成日時",
    }),
    updatedAt: z.string().openapi({
      example: "2024-07-08T10:00:00.000Z",
      description: "更新日時",
    }),
  })
  .openapi("DataSource")

/**
 * リポジトリレスポンススキーマ（後方互換用）
 * @deprecated API互換性のために残しているが、repositoryBaseSchemaを使用することを推奨
 */
export const repositorySchema = repositoryBaseSchema

/**
 * ユーザーウォッチレスポンススキーマ
 */
export const userWatchSchema = z
  .object({
    id: z.string().openapi({
      example: "01234567-89ab-cdef-0123-456789abcdef",
      description: "ユーザーウォッチID",
    }),
    userId: z.string().openapi({
      example: "01234567-89ab-cdef-0123-456789abcdef",
      description: "ユーザーID",
    }),
    dataSourceId: z.string().openapi({
      example: "01234567-89ab-cdef-0123-456789abcdef",
      description: "データソースID",
    }),
    notificationEnabled: z.boolean().openapi({
      example: true,
      description: "通知が有効かどうか",
    }),
    watchReleases: z.boolean().openapi({
      example: true,
      description: "リリースを監視するか",
    }),
    watchIssues: z.boolean().openapi({
      example: false,
      description: "イシューを監視するか",
    }),
    watchPullRequests: z.boolean().openapi({
      example: false,
      description: "プルリクエストを監視するか",
    }),
    addedAt: z.string().openapi({
      example: "2024-07-08T10:00:00.000Z",
      description: "追加日時",
    }),
  })
  .openapi("UserWatch")

/**
 * データソース作成レスポンススキーマ
 */
export const createDataSourceResponseSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: "成功フラグ",
    }),
    data: z
      .object({
        dataSource: dataSourceSchema,
        repository: repositorySchema,
        userWatch: userWatchSchema,
      })
      .openapi({
        description: "作成されたデータ",
      }),
  })
  .openapi("CreateDataSourceResponse")

export type CreateDataSourceResponse = z.infer<
  typeof createDataSourceResponseSchema
>
