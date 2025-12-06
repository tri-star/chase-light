import { DrizzleActivityQueryRepository } from "./infra"
import { DrizzleActivityRepository } from "./infra"
import {
  GetActivityDetailUseCase,
  GetActivityBodyTranslationStatusUseCase,
  ListDataSourceActivitiesUseCase,
  ListUserActivitiesUseCase,
  RequestActivityBodyTranslationUseCase,
  ProcessActivityBodyTranslationUseCase,
} from "./application/use-cases"
import { createActivityPresentationRoutes } from "./presentation"
import {
  createActivityBodyTranslationPort,
  resetActivityBodyTranslationPort,
} from "./infra/adapters/translation/translation-port.factory"

const activityQueryRepository = new DrizzleActivityQueryRepository()
const activityRepository = new DrizzleActivityRepository()

const listUserActivitiesUseCase = new ListUserActivitiesUseCase(
  activityQueryRepository,
)
const listDataSourceActivitiesUseCase = new ListDataSourceActivitiesUseCase(
  activityQueryRepository,
)
const getActivityDetailUseCase = new GetActivityDetailUseCase(
  activityQueryRepository,
)
const requestActivityBodyTranslationUseCase =
  new RequestActivityBodyTranslationUseCase(activityRepository)
const getActivityBodyTranslationStatusUseCase =
  new GetActivityBodyTranslationStatusUseCase(activityRepository)

const activityRoutes = createActivityPresentationRoutes(
  listUserActivitiesUseCase,
  getActivityDetailUseCase,
  listDataSourceActivitiesUseCase,
  requestActivityBodyTranslationUseCase,
  getActivityBodyTranslationStatusUseCase,
)

export default activityRoutes

export {
  createActivityPresentationRoutes,
  ListUserActivitiesUseCase,
  ListDataSourceActivitiesUseCase,
  GetActivityDetailUseCase,
  RequestActivityBodyTranslationUseCase,
  GetActivityBodyTranslationStatusUseCase,
  ProcessActivityBodyTranslationUseCase,
  DrizzleActivityQueryRepository,
  DrizzleActivityRepository,
}

export { createActivityBodyTranslationPort, resetActivityBodyTranslationPort }

export * from "./domain"
