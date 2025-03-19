import { ChaseLightApp } from '@/handlers/api-gateway/app/chase-light-app'
import { ListNotificationAction } from '@/handlers/api-gateway/notification/actions/list-notification-action'
import { handlerPath } from '@/lib/hono/handler-resolver'
import { currentDirPath } from '@/lib/utils/path-utils'
import {
  handle,
  type APIGatewayProxyResult,
  type LambdaContext,
  type LambdaEvent,
} from 'hono/aws-lambda'

export const notificationApp: ChaseLightApp = new ChaseLightApp()

notificationApp.defineLambdaDefinition({
  notificationHandler: {
    handler: `${handlerPath(currentDirPath(import.meta.url))}/index.handler`,
    timeout: 15,
    events: [
      {
        http: {
          method: 'ANY',
          path: 'notifications/{proxy+}',
        },
      },
      {
        http: {
          method: 'ANY',
          path: 'notifications',
        },
      },
    ],
  },
})
notificationApp.importActions([new ListNotificationAction()])

export const handler: (
  event: LambdaEvent,
  lambdaContext?: LambdaContext,
) => Promise<APIGatewayProxyResult> = handle(notificationApp.getApp())
