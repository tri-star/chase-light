import { ActionDefinition } from '@/lib/hono/action-definition'
import { type AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { ROUTES } from '@/handlers/api-gateway/app/route-consts'
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import {
  notificationSearchResultSchema,
  type NotificationSearchResult,
} from '@/features/notification/domain/notification'
import { convertDatesToISO8601 } from '@/lib/utils/date-utils'

export class ListNotificationAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ['notifications'],
      method: 'get',
      path: ROUTES.NOTIFICATIONS.LIST.DEFINITION,
      security: [
        {
          AppBearer: [],
        },
      ],
      request: {},
      responses: {
        200: {
          description: '処理成功',
          content: {
            'application/json': {
              schema: notificationSearchResultSchema,
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

        const prisma = getPrismaClientInstance()

        const notificationList = await prisma.notification.findMany({
          where: {
            userId: user.id,
          },
          include: {
            notificationItems: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // TODO: ページング対応
        })

        const totalNotifications = await prisma.notification.count({
          where: {
            userId: user.id,
          },
        })

        return c.json(
          notificationSearchResultSchema.parse({
            result: convertDatesToISO8601(notificationList),
            total: totalNotifications,
          } satisfies NotificationSearchResult),
          200,
        )
      } catch (error) {
        console.error(error)
        return c.json({ error: 'Unknown error' }, 500)
      }
    })
  }
}
