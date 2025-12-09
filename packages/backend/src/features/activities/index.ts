import { buildActivityDeps } from "./application/activity-deps"
import { createActivityPresentationRoutes } from "./presentation"

const activityRoutes = createActivityPresentationRoutes(buildActivityDeps())

export default activityRoutes

export { buildActivityDeps } from "./application/activity-deps"
export type {
  ActivityDeps,
  BuildActivityDepsOptions,
} from "./application/activity-deps"

export { createActivityPresentationRoutes } from "./presentation"

export {
  ListUserActivitiesUseCase,
  ListDataSourceActivitiesUseCase,
  GetActivityDetailUseCase,
} from "./application/use-cases"

export { DrizzleActivityQueryRepository } from "./infra"

export * from "./domain"
