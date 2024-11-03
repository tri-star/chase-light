import { ChaseLightApp } from "@/app/chase-light-app"
import { SignupVieProviderAction } from "@/features/user/functions/actions/signup-via-provider-action"
import { handlerPath } from "@/lib/hono/handler-resolver"
import { currentDirPath } from "@/lib/utils/path-utils"
import {
  handle,
  type APIGatewayProxyResult,
  type LambdaContext,
  type LambdaEvent,
} from "hono/aws-lambda"

export const userApp: ChaseLightApp = new ChaseLightApp()

userApp.defineLambdaDefinition({
  userHandler: {
    handler: `${handlerPath(currentDirPath(import.meta.url))}/index.handler`,
    timeout: 15,
    events: [
      {
        http: {
          method: "ANY",
          path: "users/{proxy+}",
        },
      },
      {
        http: {
          method: "ANY",
          path: "users",
        },
      },
    ],
  },
})
userApp.importActions([new SignupVieProviderAction()])

export const handler: (
  event: LambdaEvent,
  lambdaContext?: LambdaContext,
) => Promise<APIGatewayProxyResult> = handle(userApp.getApp())