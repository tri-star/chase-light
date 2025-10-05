/**
 * アクティビティフィーチャーの公開API
 */

import { DrizzleActivityRepository } from "./infra/repositories/drizzle-activity.repository"
import {
  ListUserActivitiesUseCase,
  GetActivityDetailUseCase,
  ListDataSourceActivitiesUseCase,
} from "./application/use-cases"
import { createActivityRoutes } from "./presentation/routes/activities"

// リポジトリのインスタンス化
const activityRepository = new DrizzleActivityRepository()

// ユースケースのインスタンス化
export const listUserActivitiesUseCase = new ListUserActivitiesUseCase(
  activityRepository,
)

export const getActivityDetailUseCase = new GetActivityDetailUseCase(
  activityRepository,
)

export const listDataSourceActivitiesUseCase =
  new ListDataSourceActivitiesUseCase(activityRepository)

// ルートの作成
const activityRoutes = createActivityRoutes(
  listUserActivitiesUseCase,
  getActivityDetailUseCase,
)

export default activityRoutes

// 型定義と定数のエクスポート
export * from "./domain/activity"
export * from "./application/use-cases"
export * from "./presentation/shared/error-handling"
