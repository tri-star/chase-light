import {
  signupResultSchema,
  signupViaProviderSchema,
  type SignupResult,
} from '@/features/user/domain/user'
import { getTokenParserInstance } from '@/features/auth/services/token-parser'
import { ActionDefinition } from '@/lib/hono/action-definition'
import { type AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { ROUTES } from '@/handlers/api-gateway/app/route-consts'
import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import { v7 as uuidv7 } from 'uuid'
import { ToDbDateTimeStrict } from '@/lib/utils/date-utils'
import { TokenError } from '@/features/auth/services/token-parser-interface'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'

export class SignupVieProviderAction extends ActionDefinition<AppContext> {
  buildOpenApiAppRoute(parentApp: OpenAPIHono<AppContext>): void {
    const route = createRoute({
      tags: ['users'],
      method: 'post',
      path: ROUTES.USERS.SIGNUP_VIA_PROVIDER.DEFINITION,
      request: {
        body: {
          content: {
            'application/json': {
              schema: signupViaProviderSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: signupResultSchema,
            },
          },
        },
        400: {
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
      const json = c.req.valid('json')
      const accessToken = json.accessToken
      const idToken = json.idToken

      const tokenParser = getTokenParserInstance()

      try {
        await tokenParser.parseAccessToken(accessToken)
        const payload = await tokenParser.parseIdToken(idToken)

        const userId = uuidv7()

        // TODO: 既存アカウントがある場合は更新してOKを返す
        // TODO: nicknameが既存アカウントと重複する場合は登録不可
        // TODO: メールが未登録、未確認の場合も登録不可

        const prisma = getPrismaClientInstance()
        const createdUser = await prisma.user.create({
          data: {
            id: userId,
            providerId: payload.sub || '',
            accountName: payload.nickname || '',
            displayName: payload.name || '',
            email: payload.email || '',
            emailVerified: payload.email_verified || false,
            createdAt: ToDbDateTimeStrict(new Date()),
            updatedAt: ToDbDateTimeStrict(new Date()),
          },
        })

        return c.json(
          {
            user: createdUser,
            success: true,
            status: 'created',
          } as SignupResult,
          200,
        )
      } catch (error) {
        console.error(error)
        if (error instanceof TokenError) {
          return c.json({ error: error.message }, 400)
        }
        return c.json({ error: 'Unknown error' }, 500)
      }
    })
  }
}
