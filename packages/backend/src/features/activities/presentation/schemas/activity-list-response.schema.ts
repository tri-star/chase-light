import { z } from "@hono/zod-openapi"

export const activitySourceMetadataSchema = z
  .object({
    repositoryFullName: z.string().optional().openapi({
      description: "GitHubリポジトリのフルネーム",
      example: "octocat/hello-world",
    }),
    repositoryLanguage: z.string().nullable().optional().openapi({
      description: "リポジトリの主要言語",
      example: "TypeScript",
    }),
    starsCount: z.number().int().optional().openapi({
      description: "スター数",
      example: 1234,
    }),
    forksCount: z.number().int().optional().openapi({
      description: "フォーク数",
      example: 256,
    }),
    openIssuesCount: z.number().int().optional().openapi({
      description: "未解決Issue数",
      example: 42,
    }),
  })
  .partial()
  .optional()

export const activitySourceSchema = z.object({
  id: z.string().uuid().openapi({
    description: "データソースID",
    example: "8a9d3d7f-4c62-4b8c-8b3a-6b5c5d6e7f8a",
  }),
  sourceType: z.string().openapi({
    description: "データソース種別",
    example: "github",
  }),
  name: z.string().openapi({
    description: "データソース名",
    example: "octocat/hello-world",
  }),
  url: z.string().url().openapi({
    description: "データソースURL",
    example: "https://github.com/octocat/hello-world",
  }),
  metadata: activitySourceMetadataSchema.openapi({
    description: "データソースに紐づく追加メタ情報",
  }),
})

export const activityNotificationSchema = z.object({
  hasUnread: z.boolean().openapi({
    description: "未読通知が存在するか",
    example: true,
  }),
  latestSentAt: z.string().datetime().nullable().openapi({
    description: "最新の通知送信日時",
    example: "2024-01-02T12:34:56.000Z",
  }),
})

export const activitySummarySchema = z.object({
  id: z.string().uuid().openapi({
    description: "アクティビティID",
    example: "1f2e3d4c-5b6a-7980-1121-314151617181",
  }),
  activityType: z
    .enum(["release", "issue", "pull_request"])
    .openapi({ description: "アクティビティの種別", example: "release" }),
  title: z.string().openapi({
    description: "アクティビティのタイトル",
    example: "v1.2.0 をリリース",
  }),
  summary: z.string().nullable().openapi({
    description: "本文から生成したサマリ",
    example: "主な変更点: パフォーマンス改善とバグ修正",
  }),
  detail: z.string().nullable().optional().openapi({
    description: "本文の抜粋 (一覧では省略される場合あり)",
    example: null,
  }),
  status: z
    .enum(["pending", "processing", "completed", "failed"])
    .openapi({ description: "処理ステータス", example: "completed" }),
  statusDetail: z.string().nullable().openapi({
    description: "ステータスに関する補足説明",
    example: null,
  }),
  version: z.string().nullable().openapi({
    description: "リリースバージョンなど",
    example: "v1.2.0",
  }),
  occurredAt: z.string().datetime().openapi({
    description: "アクティビティ発生日時",
    example: "2024-01-02T12:00:00.000Z",
  }),
  lastUpdatedAt: z.string().datetime().openapi({
    description: "最終更新日時",
    example: "2024-01-02T12:30:00.000Z",
  }),
  source: activitySourceSchema,
})

export const activityListItemSchema = z.object({
  activity: activitySummarySchema,
  notification: activityNotificationSchema,
})

export const paginationSchema = z.object({
  page: z.number().int().min(1).openapi({
    description: "現在のページ番号",
    example: 1,
  }),
  perPage: z.number().int().min(1).max(100).openapi({
    description: "1ページあたりの件数",
    example: 20,
  }),
  total: z.number().int().min(0).openapi({
    description: "総件数",
    example: 120,
  }),
  totalPages: z.number().int().min(0).openapi({
    description: "総ページ数",
    example: 6,
  }),
  hasNext: z.boolean().openapi({
    description: "次ページが存在するか",
    example: true,
  }),
  hasPrev: z.boolean().openapi({
    description: "前ページが存在するか",
    example: false,
  }),
})

export const activityListResponseSchema = z
  .object({
    success: z.literal(true).openapi({
      description: "成功フラグ",
      example: true,
    }),
    data: z.object({
      items: z.array(activityListItemSchema).openapi({
        description: "アクティビティ一覧",
      }),
      pagination: paginationSchema,
    }),
  })
  .openapi("ActivityListResponse")

export const dataSourceActivityListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      dataSource: activitySourceSchema,
      items: z.array(activityListItemSchema),
      pagination: paginationSchema,
    }),
  })
  .openapi("DataSourceActivityListResponse")

export type ActivityListResponse = z.infer<typeof activityListResponseSchema>
export type DataSourceActivityListResponse = z.infer<
  typeof dataSourceActivityListResponseSchema
>
