import { z } from "@hono/zod-openapi"

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

export type UserParams = z.infer<typeof userParams>
