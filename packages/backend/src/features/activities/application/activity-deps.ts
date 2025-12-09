import { DrizzleActivityQueryRepository } from "../infra"
import {
  GetActivityDetailUseCase,
  ListDataSourceActivitiesUseCase,
  ListUserActivitiesUseCase,
} from "./use-cases"

/**
 * Activity機能の依存関係を定義する型
 */
export interface ActivityDeps {
  listUserActivitiesUseCase: ListUserActivitiesUseCase
  getActivityDetailUseCase: GetActivityDetailUseCase
  listDataSourceActivitiesUseCase: ListDataSourceActivitiesUseCase
}

/**
 * buildActivityDeps関数のオプション
 */
export interface BuildActivityDepsOptions {
  useCaseOverrides?: Partial<ActivityDeps>
}

/**
 * Activity機能の依存関係を構築する
 *
 * @param options - オプション設定。useCaseOverridesで特定のUseCaseを差し替え可能
 * @returns Activity機能の依存関係セット
 */
export function buildActivityDeps(
  options?: BuildActivityDepsOptions,
): ActivityDeps {
  const activityQueryRepository = new DrizzleActivityQueryRepository()

  return {
    listUserActivitiesUseCase: new ListUserActivitiesUseCase(
      activityQueryRepository,
    ),
    getActivityDetailUseCase: new GetActivityDetailUseCase(
      activityQueryRepository,
    ),
    listDataSourceActivitiesUseCase: new ListDataSourceActivitiesUseCase(
      activityQueryRepository,
    ),
    ...options?.useCaseOverrides,
  }
}
