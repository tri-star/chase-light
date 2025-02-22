import { authMiddleware } from '@/handlers/api-gateway/app/middlewares/auth-middleware'
import type { User } from '@/features/user/domain/user'
import { HonoOpenApiApp } from '@/lib/hono/hono-openapi-app'
import { cors } from 'hono/cors'
import { otlpMiddleware } from '@/handlers/api-gateway/app/middlewares/otlp-middleware'

export type AppContext = {
  Variables: {
    user: undefined | User
  }
}

export class ChaseLightApp extends HonoOpenApiApp<AppContext> {
  init() {
    if (!this.app) {
      throw new Error('App is not initialized')
    }
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

    this.app.use(otlpMiddleware)
    this.app.use(authMiddleware)
  }
}
