import { authMiddleware } from '@/app/middlewares/auth-middleware'
import type { User } from '@/features/user/domain/user'
import { HonoOpenApiApp } from '@/lib/hono/hono-openapi-app'
import { cors } from 'hono/cors'

export type AppContext = {
  Variables: {
    user: undefined | User
  }
}

export class ChaseLightApp extends HonoOpenApiApp<AppContext> {
  constructor() {
    super()

    this.app.openAPIRegistry.registerComponent('securitySchemes', 'AppBearer', {
      type: 'http',
      scheme: 'bearer',
    })

    this.setCorsSetting({
      origins: ['*'],
      headers: ['Authorization', 'Content-Type'],
      allowCredentials: false,
    })
    this.app.use(
      cors({
        origin: '*',
        allowHeaders: ['Authorization', 'Content-Type'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      }),
    )

    this.app.use(authMiddleware)
  }
}
