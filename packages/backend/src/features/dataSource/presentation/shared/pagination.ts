import { z } from "@hono/zod-openapi"
import type { GitHubApiOptions } from "../../types/api-options"
import type { BasicPaginationQuery } from "./common-schemas"

/**
 * 共通ページネーション関連
 */

// ページネーションメタ情報の共通スキーマ
export const paginationMeta = z
  .object({
    page: z.number().openapi({
      example: 1,
      description: "現在のページ番号",
    }),
    perPage: z.number().openapi({
      example: 30,
      description: "1ページあたりの件数",
    }),
    hasNext: z.boolean().openapi({
      example: true,
      description: "次のページが存在するかどうか",
    }),
    hasPrev: z.boolean().openapi({
      example: false,
      description: "前のページが存在するかどうか",
    }),
  })
  .openapi({
    description: "ページネーション情報",
  })

// 基本的なAPIレスポンス構造（ページネーション付き）
export const createPaginatedResponse = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.boolean().openapi({
      example: true,
      description: "API呼び出しの成功・失敗を示すフラグ",
    }),
    data: z.array(dataSchema),
    meta: paginationMeta,
  })

// GitHubApiOptionsへのマッピング関数
export const mapToGitHubApiOptions = (
  query: BasicPaginationQuery,
): GitHubApiOptions => ({
  page: query.page,
  perPage: query.perPage,
})
