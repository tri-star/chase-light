import { OpenAPIHono } from "@hono/zod-openapi"
import type {
  RegisterDataSourceWatchUseCase,
  ListDataSourcesUseCase,
  GetDataSourceUseCase,
  UpdateDataSourceUseCase,
  RemoveDataSourceWatchUseCase,
} from "../application/use-cases"
import type { ListDataSourceActivitiesUseCase } from "../../activities/application/use-cases"
import { createDataSourceRoutes } from "./routes/data-sources"

/**
 * データソース機能のメインルートファクトリー
 */
export function createDataSourcePresentationRoutes(
  registerDataSourceWatchUseCase: RegisterDataSourceWatchUseCase,
  listDataSourcesUseCase: ListDataSourcesUseCase,
  getDataSourceUseCase: GetDataSourceUseCase,
  updateDataSourceUseCase: UpdateDataSourceUseCase,
  removeDataSourceWatchUseCase: RemoveDataSourceWatchUseCase,
  listDataSourceActivitiesUseCase: ListDataSourceActivitiesUseCase,
) {
  const app = new OpenAPIHono()

  // /data-sources 配下のルートを登録
  app.route(
    "/data-sources",
    createDataSourceRoutes(
      registerDataSourceWatchUseCase,
      listDataSourcesUseCase,
      getDataSourceUseCase,
      updateDataSourceUseCase,
      removeDataSourceWatchUseCase,
      listDataSourceActivitiesUseCase,
    ),
  )

  return app
}
