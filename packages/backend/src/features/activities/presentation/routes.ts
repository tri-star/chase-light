import { OpenAPIHono } from "@hono/zod-openapi"
import type { ActivityDepsOverrides } from "../application"
import { buildActivityDeps } from "../application"
import { createActivitiesRoutes } from "./routes/activities"
import { createActivityTranslationsBodyRoutes } from "./routes/activities/translations-body"
import { createDataSourceActivitiesRoutes } from "./routes/data-source-activities"

export function createActivityPresentationRoutes(
  overrides?: ActivityDepsOverrides,
) {
  const deps = buildActivityDeps(overrides)
  const { useCases } = deps

  const app = new OpenAPIHono()

  app.route(
    "/activities",
    createActivitiesRoutes(
      useCases.listUserActivities,
      useCases.getActivityDetail,
    ),
  )

  app.route(
    "/activities",
    createActivityTranslationsBodyRoutes(
      useCases.requestActivityTranslation,
      useCases.getActivityTranslationStatus,
    ),
  )

  app.route(
    "/data-sources",
    createDataSourceActivitiesRoutes(useCases.listDataSourceActivities),
  )

  return app
}
