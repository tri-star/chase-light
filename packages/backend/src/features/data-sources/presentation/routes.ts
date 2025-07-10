import { OpenAPIHono } from "@hono/zod-openapi"
import type {
  DataSourceCreationService,
  DataSourceListService,
} from "../services"
import { createDataSourceRoutes } from "./routes/data-sources"

/**
 * データソース機能のメインルートファクトリー
 */
export function createDataSourcePresentationRoutes(
  dataSourceCreationService: DataSourceCreationService,
  dataSourceListService: DataSourceListService,
) {
  const app = new OpenAPIHono()

  // /data-sources 配下のルートを登録
  app.route(
    "/data-sources",
    createDataSourceRoutes(dataSourceCreationService, dataSourceListService),
  )

  return app
}
