import { ActionDefinition } from '@/lib/hono/action-definition'
import { type AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { ROUTES } from '@/handlers/api-gateway/app/route-consts'
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
// import { getPrismaClientInstance } from "@/lib/prisma/app-prisma-client"
import {
  feedLogSearchResultSchema,
  type FeedLog,
} from '@/features/feed/domain/feed-log'

export class ListUserFeedLogAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ['feeds'],
      method: 'get',
      path: ROUTES.FEEDS.LIST_ALL_LOGS.DEFINITION,
      security: [
        {
          AppBearer: [],
        },
      ],
      responses: {
        200: {
          description: '処理成功',
          content: {
            'application/json': {
              schema: feedLogSearchResultSchema,
            },
          },
        },
        // 400: {
        //   description: "バリデーションエラー",
        //   content: {
        //     "application/json": {
        //       schema: z.object({
        //         error: z.string(),
        //       }),
        //     },
        //   },
        // },
        401: {
          description: '認証エラー',
          content: {
            'application/json': {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        500: {
          description: '予期しないエラー',
          content: {
            'application/json': {
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
          return c.json({ error: 'Unauthorized' }, 401)
        }

        // const prisma = getPrismaClientInstance()

        // const feedLogList = await prisma.feedLog.findMany({
        //   where: {
        //     feed: {
        //       userId: user.id,
        //     },
        //   },
        //   include: {
        //     feed: true,
        //   },
        //   orderBy: {
        //     createdAt: "desc",
        //   },
        // })

        const feedLogList: FeedLog[] = [
          {
            id: '1234567890',
            title: 'v0.3.0',
            url: 'https://github.com/',
            date: new Date(),
            summary:
              'GitHub Copilot is an AI pair programmer that helps you write code faster.',
            createdAt: new Date(),
            updatedAt: new Date(),
            feed: {
              id: '1234567890',
              name: 'github/copilot',
              url: 'https://github.com/copilot',
              cycle: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              dataSource: {
                id: '2345678901',
                name: 'GitHub',
                url: 'https://github.com',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          },
          {
            id: '1234567891',
            title: 'v0.2.0',
            url: 'https://github.com/',
            date: new Date(),
            summary:
              'GitHub Copilot is an AI pair programmer that helps you write code faster.',
            createdAt: new Date(),
            updatedAt: new Date(),
            feed: {
              id: '1234567890',
              name: 'github/copilot2',
              url: 'https://github.com/copilot2',
              cycle: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              dataSource: {
                id: '2345678901',
                name: 'GitHub',
                url: 'https://github.com',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          },
          {
            id: '1234567892',
            title: 'v0.1.0',
            url: 'https://github.com/',
            date: new Date(),
            summary:
              'GitHub Copilot is an AI pair programmer that helps you write code faster.',
            createdAt: new Date(),
            updatedAt: new Date(),
            feed: {
              id: '1234567890',
              name: 'github/copilot3',
              url: 'https://github.com/copilot3',
              cycle: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              dataSource: {
                id: '2345678901',
                name: 'GitHub',
                url: 'https://github.com',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          },
        ]

        // TODO: ページング処理
        return c.json(
          feedLogSearchResultSchema.parse({
            result: feedLogList,
            total: 10,
            page: 1,
            pageSize: 10,
          }),
          200,
        )
      } catch (error) {
        console.error(error)
        return c.json({ error: 'Unknown error' }, 500)
      }
    })
  }
}
