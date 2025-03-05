import { ActionDefinition } from '@/lib/hono/action-definition'
import { type AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { ROUTES } from '@/handlers/api-gateway/app/route-consts'
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import { FeedRepository } from '@/features/feed/repositories/feed-repository'
import { feedDetailModelSchema } from '@/features/feed/domain/feed'
import { DbNotFoundError } from '@/errors/db-not-found-error'

export class FetchFeedAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ['feeds'],
      method: 'get',
      path: ROUTES.FEEDS.FETCH.DEFINITION,
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
          description: '処理成功',
          content: {
            'application/json': {
              schema: z.object({
                feed: feedDetailModelSchema,
                lastReleaseDate: z.string().nullable(),
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
          description: 'フィードが見つかりません',
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

        const { feedId } = c.req.valid('param')
        const feedRepository = new FeedRepository()

        try {
          const feed = await feedRepository.findFeedById(feedId)

          // 他のユーザーのフィードは参照できない
          if (feed.user.id !== user.id) {
            return c.json({ error: 'Feed not found' }, 404)
          }

          const lastReleaseDate = feed.feedGitHubMeta?.lastReleaseDate?.toISOString() ?? null

          return c.json(
            {
              feed,
              lastReleaseDate,
            },
            200,
          )
        } catch (error) {
          if (error instanceof DbNotFoundError) {
            return c.json({ error: 'Feed not found' }, 404)
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