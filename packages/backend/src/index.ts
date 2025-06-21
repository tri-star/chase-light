import { handle } from "hono/aws-lambda"
import { createApp } from "./app"

/**
 * AWS Lambda Handler
 *
 * OpenAPI対応のHonoアプリケーションをLambda環境で実行
 */
const app = createApp()

export const handler = handle(app)
