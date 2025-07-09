import { OpenAPIHono } from "@hono/zod-openapi"
import type { DataSourceCreationService } from "../services"
import { createDataSourceRoutes } from "./routes/data-sources"

/**
 * データソース機能のメインルートファクトリー
 */
export function createDataSourcePresentationRoutes(
  dataSourceCreationService: DataSourceCreationService,
) {
  const app = new OpenAPIHono()

  // /data-sources 配下のルートを登録
  app.route("/data-sources", createDataSourceRoutes(dataSourceCreationService))

  return app
}
