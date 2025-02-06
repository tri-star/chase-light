import { ActionDefinition } from '@/lib/hono/action-definition'
import { type AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { ROUTES } from '@/handlers/api-gateway/app/route-consts'
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import {
  FEED_VALIDATE_ERROR_DUPLICATE,
  FEED_VALIDATE_ERROR_NOT_SUPPORTED,
  isSupportedDataSource,
  tryExtractDataSourceUrl,
  validateFeedUrlRequestSchema,
  validateFeedUrlResponseSchema,
  type ValidateFeedUrlResponse,
} from '@/features/feed/domain/feed'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'

export class ValidateFeedUrlAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      summary: 'フィードURLバリデーション',
      tags: ['feeds'],
      method: 'get',
      path: ROUTES.FEEDS.VALIDATE_FEED_URL.DEFINITION,
      description: 'フィードURLの重複チェック、形式チェック',
      security: [
        {
          AppBearer: [],
        },
      ],
      request: {
        query: validateFeedUrlRequestSchema,
      },
      responses: {
        200: {
          description: '処理成功',
          content: {
            'application/json': {
              schema: validateFeedUrlResponseSchema,
              example: {
                success: true,
              } satisfies ValidateFeedUrlResponse,
            },
          },
        },
        400: {
          description: 'バリデーションエラー(URLの形式違反など)',
          content: {
            'application/json': {
              schema: validateFeedUrlResponseSchema,
              example: {
                success: false,
                code: FEED_VALIDATE_ERROR_NOT_SUPPORTED,
              } satisfies ValidateFeedUrlResponse,
            },
          },
        },
        409: {
          description: '重複エラー',
          content: {
            'application/json': {
              schema: validateFeedUrlResponseSchema,
              example: {
                success: false,
                code: FEED_VALIDATE_ERROR_DUPLICATE,
              } satisfies ValidateFeedUrlResponse,
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

        const query = c.req.valid('query')
        const url = query.url

        if (!isSupportedDataSource(url)) {
          return c.json(
            validateFeedUrlResponseSchema.parse({
              success: false,
              code: FEED_VALIDATE_ERROR_NOT_SUPPORTED,
            }),
            400,
          )
        }

        const prisma = getPrismaClientInstance()

        const dataSourceUrl = tryExtractDataSourceUrl(url)
        if (!dataSourceUrl) {
          return c.json(
            validateFeedUrlResponseSchema.parse({
              success: false,
              code: FEED_VALIDATE_ERROR_NOT_SUPPORTED,
            }),
            400,
          )
        }

        const feedList = await prisma.feed.findMany({
          where: {
            userId: user.id,
            dataSource: {
              url: dataSourceUrl,
            },
          },
          include: {
            dataSource: true,
          },
        })

        if (feedList.length > 0) {
          return c.json(
            validateFeedUrlResponseSchema.parse({
              success: false,
              code: FEED_VALIDATE_ERROR_DUPLICATE,
            }),
            409,
          )
        }

        return c.json(
          validateFeedUrlResponseSchema.parse({
            success: true,
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
