import { OpenAPIHono } from "@hono/zod-openapi"
import type {
  GetNotificationDetailUseCase,
  ListNotificationsUseCase,
} from "../application/use-cases"
import { createNotificationRoutes } from "./routes/notifications"

export function createNotificationPresentationRoutes(
  listNotificationsUseCase: ListNotificationsUseCase,
  getNotificationDetailUseCase: GetNotificationDetailUseCase,
) {
  const app = new OpenAPIHono()

  app.route(
    "/notifications",
    createNotificationRoutes(
      listNotificationsUseCase,
      getNotificationDetailUseCase,
    ),
  )

  return app
}
