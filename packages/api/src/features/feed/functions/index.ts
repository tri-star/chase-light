import { ChaseLightApp } from "@/app/chase-light-app"
import { CreateFeedAction } from "@/features/feed/functions/actions/create-feed-action"
import { ListFeedAction } from "@/features/feed/functions/actions/list-feed-action"
import { handlerPath } from "@/lib/hono/handler-resolver"
import { currentDirPath } from "@/lib/utils/path-utils"
import {
  handle,
  type APIGatewayProxyResult,
  type LambdaContext,
  type LambdaEvent,
} from "hono/aws-lambda"

export const feedApp: ChaseLightApp = new ChaseLightApp()

feedApp.defineLambdaDefinition({
  userHandler: {
    handler: `${handlerPath(currentDirPath(import.meta.url))}/index.handler`,
    timeout: 15,
    events: [
      {
        http: {
          method: "ANY",
          path: "feeds/{proxy+}",
        },
      },
      {
        http: {
          method: "ANY",
          path: "feeds",
        },
      },
    ],
  },
})
feedApp.importActions([
  new CreateFeedAction(),
  new ListFeedAction(),
  //
])

export const handler: (
  event: LambdaEvent,
  lambdaContext?: LambdaContext,
) => Promise<APIGatewayProxyResult> = handle(feedApp.getApp())
