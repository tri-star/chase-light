import { OpenAPIHono } from "@hono/zod-openapi"
import { createNotificationRoutes } from "./routes/notifications"
import { DrizzleNotificationQueryRepository } from "../infra"
import { ListNotificationsUseCase } from "../application/use-cases/list-notifications.use-case"
import { GetNotificationDetailUseCase } from "../application/use-cases/get-notification-detail.use-case"

export function createNotificationPresentationRoutes() {
  const app = new OpenAPIHono()

  const notificationQueryRepository = new DrizzleNotificationQueryRepository()

  const listNotificationsUseCase = new ListNotificationsUseCase(
    notificationQueryRepository,
  )
  const getNotificationDetailUseCase = new GetNotificationDetailUseCase(
    notificationQueryRepository,
  )

  app.route(
    "/notifications",
    createNotificationRoutes(
      listNotificationsUseCase,
      getNotificationDetailUseCase,
    ),
  )

  return app
}
