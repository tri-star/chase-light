import { userSchema } from '@/features/user/domain/user'
import { ActionDefinition } from '@/lib/hono/action-definition'
import { type AppContext } from '@/app/chase-light-app'
import { ROUTES } from '@/app/route-consts'
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'

export class FetchSelfAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ['users'],
      method: 'get',
      path: ROUTES.USERS.FETCH_SELF.DEFINITION,
      security: [
        {
          AppBearer: [],
        },
      ],
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: z.object({
                user: userSchema,
              }),
            },
          },
        },
        401: {
          description: '',
          content: {
            'application/json': {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
        500: {
          description: '',
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

        return c.json(
          {
            user: user,
          },
          200,
        )
      } catch (error) {
        console.error(error)
        return c.json({ error: 'Unknown error' }, 500)
      }
    })
  }
}
