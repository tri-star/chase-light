import type { AppContext } from '@/handlers/api-gateway/app/chase-light-app'
import { ROUTES } from '@/handlers/api-gateway/app/route-consts'
import { getTokenParserInstance } from '@/features/auth/services/token-parser'
import { TokenError } from '@/features/auth/services/token-parser-interface'
import type { User } from '@/features/user/domain/user'
import { getPrismaClientInstance } from '@/lib/prisma/app-prisma-client'
import { createMiddleware } from 'hono/factory'

export const authMiddleware = createMiddleware<AppContext>(async (c, next) => {
  console.debug('authMiddleware: start', c.req.path)
  const noAuthRoutes: string[] = [
    '/docs/api',
    '/openapi.json',
    ROUTES.USERS.SIGNUP_VIA_PROVIDER.DEFINITION,
    //
  ]
  if (noAuthRoutes.includes(c.req.path)) {
    await next()
    return
  }

  const authHeader = `${c.req.header('Authorization')}`
  const accessToken = authHeader.replace(/^Bearer /, '')

  try {
    const tokenParser = getTokenParserInstance()
    const providerId = await tokenParser.extractProviderId(accessToken)

    const prismaClient = getPrismaClientInstance()
    const dbUser = await prismaClient.user.findFirst({
      where: {
        providerId,
      },
    })
    if (dbUser == null) {
      c.res = new Response('Unauthorized', { status: 401 })
      await next()
      return
    }

    const user: User = {
      id: dbUser.id,
      accountName: dbUser.accountName,
      displayName: dbUser.displayName,
      emailVerified: dbUser.emailVerified,
      email: dbUser.email,
      providerId: dbUser.providerId,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    }

    c.set('user', user)
  } catch (e) {
    console.error(e)
    if (e instanceof TokenError) {
      c.res = new Response('Unauthorized', { status: 401 })
      // TODO: Auth0起因の場合は500エラーを返す
      await next()
      return
    }
    c.res = new Response('Unknown error', { status: 500 })
  }

  await next()
})
