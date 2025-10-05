import { DrizzleActivityQueryRepository } from "./infra"
import {
  GetActivityDetailUseCase,
  ListDataSourceActivitiesUseCase,
  ListUserActivitiesUseCase,
} from "./application/use-cases"
import { createActivityPresentationRoutes } from "./presentation"

const activityQueryRepository = new DrizzleActivityQueryRepository()

const listUserActivitiesUseCase = new ListUserActivitiesUseCase(
  activityQueryRepository,
)
const listDataSourceActivitiesUseCase = new ListDataSourceActivitiesUseCase(
  activityQueryRepository,
)
const getActivityDetailUseCase = new GetActivityDetailUseCase(
  activityQueryRepository,
)

const activityRoutes = createActivityPresentationRoutes(
  listUserActivitiesUseCase,
  getActivityDetailUseCase,
  listDataSourceActivitiesUseCase,
)

export default activityRoutes

export {
  createActivityPresentationRoutes,
  ListUserActivitiesUseCase,
  ListDataSourceActivitiesUseCase,
  GetActivityDetailUseCase,
  DrizzleActivityQueryRepository,
}

export * from "./domain"
