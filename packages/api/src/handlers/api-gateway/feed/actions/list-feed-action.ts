import { ActionDefinition } from '@/lib/hono/action-definition'
import { type AppContext } from '@/app/chase-light-app'
import { ROUTES } from '@/app/route-consts'
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import {
  feedSearchRequestSchema,
  feedSearchResultSchema,
} from '@/features/feed/domain/feed'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'

export class ListFeedAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ['feeds'],
      method: 'get',
      path: ROUTES.FEEDS.CREATE.DEFINITION,
      security: [
        {
          AppBearer: [],
        },
      ],
      request: {
        query: feedSearchRequestSchema,
      },
      responses: {
        200: {
          description: '処理成功',
          content: {
            'application/json': {
              schema: feedSearchResultSchema,
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

        const query = c.req.valid('query')

        const prisma = getPrismaClientInstance()
        const orderBy = buildOrderQuery(query)

        const feedList = await prisma.feed.findMany({
          where: {
            userId: user.id,
            ...(query.keyword && {
              name: {
                contains: query.keyword,
              },
            }),
          },
          include: {
            dataSource: true,
          },
          orderBy,
        })

        // TODO: ページング処理
        return c.json(
          feedSearchResultSchema.parse({
            result: feedList,
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

function buildOrderQuery(query: unknown) {
  const queryObj = feedSearchRequestSchema.parse(query)

  const orderBy: {
    [k in Exclude<(typeof queryObj)['sort'], undefined>]?: 'asc' | 'desc'
  } = {}

  if (queryObj.sort) {
    orderBy[queryObj.sort] = queryObj.sortDirection || 'asc'
  }

  return orderBy
}
