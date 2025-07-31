import { OpenAPIHono } from "@hono/zod-openapi"
import type {
  DataSourceWatchService,
  DataSourceListService,
  DataSourceDetailService,
  DataSourceUpdateService,
  DataSourceDeletionService,
} from "../services"
import { createDataSourceRoutes } from "./routes/data-sources"

/**
 * データソース機能のメインルートファクトリー
 */
export function createDataSourcePresentationRoutes(
  dataSourceWatchService: DataSourceWatchService,
  dataSourceListService: DataSourceListService,
  dataSourceDetailService: DataSourceDetailService,
  dataSourceUpdateService: DataSourceUpdateService,
  dataSourceDeletionService: DataSourceDeletionService,
) {
  const app = new OpenAPIHono()

  // /data-sources 配下のルートを登録
  app.route(
    "/data-sources",
    createDataSourceRoutes(
      dataSourceWatchService,
      dataSourceListService,
      dataSourceDetailService,
      dataSourceUpdateService,
      dataSourceDeletionService,
    ),
  )

  return app
}
