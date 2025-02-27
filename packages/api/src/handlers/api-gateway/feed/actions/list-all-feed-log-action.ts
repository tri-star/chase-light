import { ActionDefinition } from '@/lib/hono/action-definition'
import { type AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { ROUTES } from '@/handlers/api-gateway/app/route-consts'
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import {
  feedLogListSearchRequestCommandSchema,
  feedLogSearchResultModelSchema,
} from '@/features/feed/domain/feed-log'
import { FeedLogRepository } from '@/features/feed/repositories/feed-log-repository'

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
      request: {
        query: feedLogListSearchRequestCommandSchema,
      },
      responses: {
        200: {
          description: '処理成功',
          content: {
            'application/json': {
              schema: feedLogSearchResultModelSchema,
            },
          },
        },
        400: {
          description: 'バリデーションエラー',
          content: {
            'application/json': {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
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

        const queries = c.req.valid('query')
        const currentPage = Math.max(Number(queries.page ?? 1), 1)
        const pageSize = Number(queries.pageSize)

        if (pageSize < 1 || pageSize > 100) {
          return c.json({ error: 'Invalid page size' }, 400)
        }

        const feedLogRepository = new FeedLogRepository()
        const { count, items: feedLogList } =
          await feedLogRepository.findFeedLogsListItemModelsByUserId(
            user.id,
            pageSize,
            currentPage,
          )

        // TODO: ページング処理
        return c.json(
          feedLogSearchResultModelSchema.parse({
            result: feedLogList,
            total: count,
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
