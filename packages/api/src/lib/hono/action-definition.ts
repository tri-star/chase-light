import { type OpenAPIHono } from '@hono/zod-openapi'
import { type Env } from 'hono'

export abstract class ActionDefinition<T extends Env = Env> {
  abstract buildOpenApiAppRoute(app: OpenAPIHono<T>): void
}
