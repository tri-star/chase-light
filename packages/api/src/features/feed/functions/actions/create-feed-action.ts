import { ActionDefinition } from "@/lib/hono/action-definition"
import { type AppContext } from "@/app/chase-light-app"
import { ROUTES } from "@/app/route-consts"
import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi"
import {
  createFeedRequestSchema,
  feedSchema,
} from "@/features/feed/domain/feed"
import { v7 as uuidv7 } from "uuid"
import { getPrismaClientInstance } from "@/lib/prisma/app-prisma-client"
import type { CycleValue } from "core/features/feed/feed"

export class CreateFeedAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ["feeds"],
      method: "post",
      path: ROUTES.FEEDS.CREATE.DEFINITION,
      security: [
        {
          AppBearer: [],
        },
      ],
      request: {
        body: {
          content: {
            "application/json": {
              schema: createFeedRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "処理成功",
          content: {
            "application/json": {
              schema: z.object({
                feed: feedSchema,
              }),
            },
          },
        },
        400: {
          description: "バリデーションエラー",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        401: {
          description: "認証エラー",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        500: {
          description: "予期しないエラー",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
      },
    })

    parentApp.openapi(route, async (c) => {
      try {
        const user = c.var.user
        if (user == null) {
          return c.json({ error: "Unauthorized" }, 401)
        }
        const input = c.req.valid("json")

        const datasourceId = uuidv7()
        const startTime = new Date()

        // TODO: トランザクションが必要
        // TODO: 正規化したURLで重複チェック

        const prisma = getPrismaClientInstance()

        const feedId = uuidv7()
        const createdFeed = await prisma.feed.create({
          data: {
            id: feedId,
            name: input.name,
            cycle: input.cycle,
            dataSource: {
              create: {
                id: datasourceId,
                name: input.name,
                url: input.url,
                createdAt: startTime,
                updatedAt: startTime,
              },
            },
            user: {
              connect: {
                id: user.id,
              },
            },
            createdAt: startTime,
            updatedAt: startTime,
          },
          include: {
            dataSource: true,
            user: true,
          },
        })

        return c.json(
          {
            feed: {
              ...createdFeed,
              cycle: createdFeed.cycle as CycleValue,
            },
          },
          200,
        )
      } catch (error) {
        console.error(error)
        return c.json({ error: "Unknown error" }, 500)
      }
    })
  }
}
