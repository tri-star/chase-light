import { ChaseLightApp } from '@/handlers/api-gateway/app/chase-light-app'
import { CreateFeedAction } from '@/handlers/api-gateway/feed/actions/create-feed-action'
import { ListUserFeedLogAction } from '@/handlers/api-gateway/feed/actions/list-all-feed-log-action'
import { ListFeedAction } from '@/handlers/api-gateway/feed/actions/list-feed-action'
import { ValidateFeedUrlAction } from '@/handlers/api-gateway/feed/actions/validate-feed-url-action'
import { handlerPath } from '@/lib/hono/handler-resolver'
import { currentDirPath } from '@/lib/utils/path-utils'
import {
  handle,
  type APIGatewayProxyResult,
  type LambdaContext,
  type LambdaEvent,
} from 'hono/aws-lambda'

export const feedApp: ChaseLightApp = new ChaseLightApp()

feedApp.defineLambdaDefinition({
  feedHandler: {
    handler: `${handlerPath(currentDirPath(import.meta.url))}/index.handler`,
    timeout: 15,
    events: [
      {
        http: {
          method: 'ANY',
          path: 'feeds/{proxy+}',
        },
      },
      {
        http: {
          method: 'ANY',
          path: 'feeds',
        },
      },
      {
        http: {
          method: 'ANY',
          path: 'feed-logs',
        },
      },
    ],
  },
})
feedApp.importActions([
  new CreateFeedAction(),
  new ListFeedAction(),
  new ListUserFeedLogAction(),
  new ValidateFeedUrlAction(),
])

export const handler: (
  event: LambdaEvent,
  lambdaContext?: LambdaContext,
) => Promise<APIGatewayProxyResult> = handle(feedApp.createApp())
