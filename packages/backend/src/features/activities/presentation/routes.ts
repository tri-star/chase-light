import { OpenAPIHono } from "@hono/zod-openapi"
import type {
  GetActivityDetailUseCase,
  ListDataSourceActivitiesUseCase,
  ListUserActivitiesUseCase,
} from "../application/use-cases"
import { createActivitiesRoutes } from "./routes/activities"
import { createDataSourceActivitiesRoutes } from "./routes/data-source-activities"

export function createActivityPresentationRoutes(
  listUserActivitiesUseCase: ListUserActivitiesUseCase,
  getActivityDetailUseCase: GetActivityDetailUseCase,
  listDataSourceActivitiesUseCase: ListDataSourceActivitiesUseCase,
) {
  const app = new OpenAPIHono()

  app.route(
    "/activities",
    createActivitiesRoutes(listUserActivitiesUseCase, getActivityDetailUseCase),
  )

  app.route(
    "/data-sources",
    createDataSourceActivitiesRoutes(listDataSourceActivitiesUseCase),
  )

  return app
}
