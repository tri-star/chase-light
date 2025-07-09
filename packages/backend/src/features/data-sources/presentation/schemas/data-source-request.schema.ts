import { z } from "@hono/zod-openapi"

/**
 * データソース作成リクエストスキーマ
 */
export const createDataSourceRequestSchema = z
  .object({
    repositoryUrl: z.string().min(1, "リポジトリURLは必須です").openapi({
      example: "https://github.com/facebook/react",
      description: "GitHubリポジトリのURL",
    }),
    name: z.string().optional().openapi({
      example: "React",
      description: "カスタム表示名（省略時はリポジトリ名を使用）",
    }),
    description: z.string().optional().openapi({
      example:
        "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
      description: "カスタム説明（省略時はリポジトリの説明を使用）",
    }),
    notificationEnabled: z.boolean().optional().default(true).openapi({
      example: true,
      description: "通知を有効にするか（デフォルト: true）",
    }),
    watchReleases: z.boolean().optional().default(true).openapi({
      example: true,
      description: "リリースを監視するか（デフォルト: true）",
    }),
    watchIssues: z.boolean().optional().default(false).openapi({
      example: false,
      description: "イシューを監視するか（デフォルト: false）",
    }),
    watchPullRequests: z.boolean().optional().default(false).openapi({
      example: false,
      description: "プルリクエストを監視するか（デフォルト: false）",
    }),
  })
  .openapi("CreateDataSourceRequest")

export type CreateDataSourceRequest = z.infer<
  typeof createDataSourceRequestSchema
>
