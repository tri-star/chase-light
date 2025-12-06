import { OpenAPIHono } from "@hono/zod-openapi"
import type {
  GetActivityDetailUseCase,
  GetActivityBodyTranslationStatusUseCase,
  ListDataSourceActivitiesUseCase,
  ListUserActivitiesUseCase,
  RequestActivityBodyTranslationUseCase,
} from "../application/use-cases"
import { createActivitiesRoutes } from "./routes/activities"
import { createDataSourceActivitiesRoutes } from "./routes/data-source-activities"
import { createActivityBodyTranslationRoutes } from "./routes/activity-body-translation"

export function createActivityPresentationRoutes(
  listUserActivitiesUseCase: ListUserActivitiesUseCase,
  getActivityDetailUseCase: GetActivityDetailUseCase,
  listDataSourceActivitiesUseCase: ListDataSourceActivitiesUseCase,
  requestActivityBodyTranslationUseCase: RequestActivityBodyTranslationUseCase,
  getActivityBodyTranslationStatusUseCase: GetActivityBodyTranslationStatusUseCase,
) {
  const app = new OpenAPIHono()

  app.route(
    "/activities",
    createActivitiesRoutes(listUserActivitiesUseCase, getActivityDetailUseCase),
  )

  app.route(
    "/activities",
    createActivityBodyTranslationRoutes(
      requestActivityBodyTranslationUseCase,
      getActivityBodyTranslationStatusUseCase,
    ),
  )

  app.route(
    "/data-sources",
    createDataSourceActivitiesRoutes(listDataSourceActivitiesUseCase),
  )

  return app
}
