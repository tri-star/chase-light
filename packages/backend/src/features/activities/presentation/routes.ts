import { OpenAPIHono } from "@hono/zod-openapi"
import type { ActivityDeps } from "../application/activity-deps"
import { createActivitiesRoutes } from "./routes/activities"
import { createDataSourceActivitiesRoutes } from "./routes/data-source-activities"

export function createActivityPresentationRoutes(deps: ActivityDeps) {
  const app = new OpenAPIHono()

  app.route("/activities", createActivitiesRoutes(deps))

  app.route("/data-sources", createDataSourceActivitiesRoutes(deps))

  return app
}
