import { ChaseLightApp } from '@/app/chase-light-app'
import { feedApp } from '@/handlers/api-gateway/feed'
import { userApp } from '@/handlers/api-gateway/user'
import { handlerPath } from '@/lib/hono/handler-resolver'
import { currentDirPath } from '@/lib/utils/path-utils'
import { apiReference } from '@scalar/hono-api-reference'
import {
  handle,
  type APIGatewayProxyResult,
  type LambdaContext,
  type LambdaEvent,
} from 'hono/aws-lambda'

export const scalerUiApp: ChaseLightApp = new ChaseLightApp()

scalerUiApp.defineLambdaDefinition({
  scalerUiHandler: {
    handler: `${handlerPath(currentDirPath(import.meta.url))}/open-api.handler`,
    timeout: 15,
    events: [
      {
        http: {
          method: 'ANY',
          path: 'docs/api/{proxy+}',
        },
      },
      {
        http: {
          method: 'ANY',
          path: 'docs/api',
        },
      },
      {
        http: {
          method: 'ANY',
          path: 'openapi.json',
        },
      },
    ],
  },
})
const honoApp = scalerUiApp.getApp()
const stage = process.env.STAGE || 'local'

honoApp.route('/', userApp.getApp())
honoApp.route('/', feedApp.getApp())
honoApp.doc('/openapi.json', {
  openapi: '3.0.0',
  servers: [
    {
      url: `/${stage}`,
      description: 'Local server',
    },
  ],
  info: {
    version: '0.2.0',
    title: `Chase Light API (${stage})`,
  },
})

honoApp.get(
  '/docs/api',
  apiReference({
    pageTitle: `(${stage}) Chase Light API Reference`,
    spec: {
      url: `/${stage}/openapi.json`,
    },
  }),
)

export const handler: (
  event: LambdaEvent,
  lambdaContext?: LambdaContext,
) => Promise<APIGatewayProxyResult> = handle(scalerUiApp.getApp())
