import { DrizzleNotificationQueryRepository } from "./infra"
import {
  GetNotificationDetailUseCase,
  ListNotificationsUseCase,
} from "./application/use-cases"
import { createNotificationPresentationRoutes } from "./presentation"

const notificationQueryRepository = new DrizzleNotificationQueryRepository()

const listNotificationsUseCase = new ListNotificationsUseCase(
  notificationQueryRepository,
)
const getNotificationDetailUseCase = new GetNotificationDetailUseCase(
  notificationQueryRepository,
)

const notificationRoutes = createNotificationPresentationRoutes(
  listNotificationsUseCase,
  getNotificationDetailUseCase,
)

export default notificationRoutes

export {
  createNotificationPresentationRoutes,
  ListNotificationsUseCase,
  GetNotificationDetailUseCase,
  DrizzleNotificationQueryRepository,
}
