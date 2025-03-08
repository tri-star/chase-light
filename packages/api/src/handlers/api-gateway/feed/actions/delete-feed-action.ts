import { ActionDefinition } from '@/lib/hono/action-definition'
import { type AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { ROUTES } from '@/handlers/api-gateway/app/route-consts'
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import { FeedRepository } from '@/features/feed/repositories/feed-repository'
import { DbNotFoundError } from '@/errors/db-not-found-error'

export class DeleteFeedAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ['feeds'],
      method: 'delete',
      path: ROUTES.FEEDS.DELETE.DEFINITION,
      security: [
        {
          AppBearer: [],
        },
      ],
      request: {
        params: z.object({
          feedId: z.string(),
        }),
      },
      responses: {
        200: {
          description: '削除成功',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean(),
              }),
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
        404: {
          description: 'フィードが見つからない',
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

        const params = c.req.valid('param')
        const feedId = params.feedId

        const feedRepository = new FeedRepository()

        try {
          const result = await feedRepository.deleteFeed(feedId, user.id)
          return c.json({ success: result }, 200)
        } catch (error) {
          if (error instanceof DbNotFoundError) {
            return c.json({ error: error.message }, 404)
          }
          throw error
        }
      } catch (error) {
        console.error(error)
        return c.json({ error: 'Unknown error' }, 500)
      }
    })
  }
}
