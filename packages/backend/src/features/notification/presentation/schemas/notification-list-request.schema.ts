import { z } from "@hono/zod-openapi"
import {
  NOTIFICATIONS_DEFAULT_LIMIT,
  NOTIFICATIONS_MAX_LIMIT,
  NOTIFICATIONS_MIN_LIMIT,
  NOTIFICATIONS_READ_FILTER,
  NOTIFICATIONS_SEARCH_MAX_LENGTH,
} from "../../constants/query.constants"

const cursorExample =
  "MjAyNS0xMC0yNVQxMDo1MDo1Ni4wMDBafDEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMA=="

const readFilterValues = [
  NOTIFICATIONS_READ_FILTER.ALL,
  NOTIFICATIONS_READ_FILTER.READ,
  NOTIFICATIONS_READ_FILTER.UNREAD,
] as const

export const notificationReadFilterSchema = z
  .enum(readFilterValues)
  .default(NOTIFICATIONS_READ_FILTER.ALL)
  .openapi({
    description: "既読フィルタ",
    example: NOTIFICATIONS_READ_FILTER.UNREAD,
  })

export const notificationListRequestSchema = z
  .object({
    cursor: z
      .string()
      .openapi({
        description: "次ページ取得用のカーソル(Base64)",
        example: cursorExample,
      })
      .optional(),
    limit: z.coerce
      .number()
      .int()
      .min(NOTIFICATIONS_MIN_LIMIT)
      .default(NOTIFICATIONS_DEFAULT_LIMIT)
      .openapi({
        description: `取得件数 (${NOTIFICATIONS_MIN_LIMIT}-${NOTIFICATIONS_MAX_LIMIT})`,
        example: NOTIFICATIONS_DEFAULT_LIMIT,
      }),
    read: notificationReadFilterSchema,
    search: z
      .string()
      .min(1)
      .max(NOTIFICATIONS_SEARCH_MAX_LENGTH)
      .openapi({
        description: "タイトル・サマリの部分一致検索キーワード",
        example: "TypeScript 5.5",
      })
      .optional(),
  })
  .openapi("NotificationListRequest")
