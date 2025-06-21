import { serve } from "@hono/node-server"
import { createApp } from "./app"

/**
 * Local Development Server
 *
 * OpenAPI仕様書とScalar UIを含むローカル開発サーバー
 * Lambda環境とは別のエントリポイント
 */

const app = createApp()
const port = Number(process.env.PORT) || 3000

console.log(`🚀 Chase Light Backend starting on port ${port}`)
console.log(
  `📚 API Documentation available at: http://localhost:${port}/scalar`,
)
console.log(`📄 OpenAPI Spec available at: http://localhost:${port}/doc`)

serve({
  fetch: app.fetch,
  port,
})
