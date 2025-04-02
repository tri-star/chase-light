import { ActionDefinition } from '@/lib/hono/action-definition'
import { type AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { ROUTES } from '@/handlers/api-gateway/app/route-consts'
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import { NotificationRepository } from '@/features/notification/repository/notification-repository'

export class MarkAsReadAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ['notifications'],
      method: 'post',
      path: ROUTES.NOTIFICATIONS.MARK_AS_READ.DEFINITION,
      security: [
        {
          AppBearer: [],
        },
      ],
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({
                notificationIds: z.array(z.string()),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: '処理成功',
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

        const { notificationIds } = await c.req.json<{
          notificationIds: string[]
        }>()

        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
          return c.json({ error: 'Invalid notificationIds' }, 400)
        }

        const repository = new NotificationRepository()
        await repository.markAsRead(user.id, notificationIds)

        return c.json({ success: true }, 200)
      } catch (error) {
        console.error(error)
        return c.json({ error: 'Unknown error' }, 500)
      }
    })
  }
}
