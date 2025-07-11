import { z } from "@hono/zod-openapi"
import { dataSourceListItemSchema } from "./data-source-list-response.schema"

/**
 * データソース詳細APIのレスポンススキーマ
 */
export const dataSourceDetailResponseSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: "API実行の成功フラグ",
    }),
    data: dataSourceListItemSchema,
  })
  .openapi("DataSourceDetailResponse")

export type DataSourceDetailResponse = z.infer<typeof dataSourceDetailResponseSchema>