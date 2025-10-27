import { z } from "@hono/zod-openapi"

const notificationDigestEntrySchema = z
  .object({
    activityId: z.string().uuid().openapi({
      description: "アクティビティID",
      example: "d5c6b7a8-1234-5678-9abc-def012345678",
    }),
    title: z.string().openapi({
      description: "エントリタイトル",
      example: "v1.5.0 をリリースしました",
    }),
    summary: z.string().openapi({
      description: "要約テキスト",
      example: "主要な改善点とバグ修正を含むリリースです。",
    }),
    occurredAt: z.string().datetime().openapi({
      description: "アクティビティ発生日時(ISO8601)",
      example: "2025-10-25T12:34:56.000Z",
    }),
    url: z.string().url().nullable().openapi({
      description: "詳細ページURL",
      example: "https://github.com/org/repo/releases/tag/v1.5.0",
    }),
    displayOrder: z.number().int().nonnegative().openapi({
      description: "通知内での表示順序",
      example: 1,
    }),
  })
  .openapi("NotificationDigestEntry")

const notificationDigestGroupSchema = z
  .object({
    activityType: z.enum(["issue", "pull_request", "release"]).openapi({
      description: "アクティビティ種別",
      example: "release",
    }),
    entries: z.array(notificationDigestEntrySchema),
  })
  .openapi("NotificationDigestGroup")

const notificationRepositorySchema = z
  .object({
    fullName: z.string().openapi({
      description: "GitHubリポジトリのフルネーム",
      example: "openai/openai",
    }),
  })
  .openapi("NotificationRepository")

const notificationDataSourceSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "データソースID",
      example: "c1d2e3f4-5678-90ab-cdef-1234567890ab",
    }),
    name: z.string().openapi({
      description: "データソース名",
      example: "openai/openai",
    }),
    url: z.string().url().openapi({
      description: "データソースURL",
      example: "https://github.com/openai/openai",
    }),
    sourceType: z.string().openapi({
      description: "データソース種別",
      example: "github_repository",
    }),
    repository: notificationRepositorySchema.optional(),
    groups: z.array(notificationDigestGroupSchema),
  })
  .openapi("NotificationDataSource")

const notificationSummarySchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "通知ID",
      example: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    }),
    type: z.string().openapi({
      description: "通知種別",
      example: "activity_digest",
    }),
    status: z.string().openapi({
      description: "通知ステータス",
      example: "pending",
    }),
    isRead: z.boolean().openapi({
      description: "既読フラグ",
      example: false,
    }),
    scheduledAt: z.string().datetime().openapi({
      description: "送信予定日時(ISO8601)",
      example: "2025-10-25T10:00:00.000Z",
    }),
    sentAt: z.string().datetime().nullable().openapi({
      description: "送信日時(ISO8601)",
      example: "2025-10-25T10:05:00.000Z",
    }),
    createdAt: z.string().datetime().openapi({
      description: "作成日時(ISO8601)",
      example: "2025-10-25T09:55:00.000Z",
    }),
    updatedAt: z.string().datetime().openapi({
      description: "更新日時(ISO8601)",
      example: "2025-10-25T09:59:00.000Z",
    }),
    lastActivityOccurredAt: z.string().datetime().openapi({
      description: "通知に含まれる最新アクティビティの発生日時(ISO8601)",
      example: "2025-10-25T08:30:00.000Z",
    }),
    metadata: z
      .record(z.string(), z.any())
      .nullable()
      .openapi({
        description: "通知メタデータ(JSON)",
        example: {
          digest: {
            range: {
              from: "2025-10-24T00:00:00.000Z",
              to: "2025-10-25T00:00:00.000Z",
              timezone: "Asia/Tokyo",
            },
          },
        },
      }),
  })
  .openapi("NotificationSummary")

export const notificationListItemSchema = z
  .object({
    notification: notificationSummarySchema,
    dataSources: z.array(notificationDataSourceSchema),
  })
  .openapi("NotificationListItem")

export const notificationListResponseSchema = z
  .object({
    success: z.literal(true).openapi({
      example: true,
    }),
    data: z.object({
      items: z.array(notificationListItemSchema),
      pageInfo: z
        .object({
          hasNext: z.boolean().openapi({
            description: "次ページが存在するかどうか",
            example: true,
          }),
          nextCursor: z
            .string()
            .openapi({
              description: "次ページ用カーソル(Base64)",
              example:
                "MjAyNS0xMC0yNVQxMDo1MDo1Ni4wMDBaOXwxYjJjM2Q0LTU2NzgtOTBhYi1jZGVmLTEyMzQ1Njc4OTBhYg==",
            })
            .optional(),
        })
        .openapi("NotificationListPageInfo"),
    }),
  })
  .openapi("NotificationListResponse")
