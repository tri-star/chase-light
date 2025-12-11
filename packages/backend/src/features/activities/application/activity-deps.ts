import type { ActivityDeps, ActivityDepsOverrides } from "./activity-deps.types"
import {
  ListUserActivitiesUseCase,
  GetActivityDetailUseCase,
  ListDataSourceActivitiesUseCase,
  RequestActivityTranslationUseCase,
  GetActivityTranslationStatusUseCase,
} from "./use-cases"
import {
  DrizzleActivityQueryRepository,
  DrizzleActivityTranslationStateRepository,
  SqsTranslationJobAdapter,
} from "../infra"

/**
 * Activity フィーチャーのデフォルト依存関係を構築する関数
 *
 * @param overrides - 依存関係の一部をオーバーライドする場合に指定
 * @returns 構築された依存関係
 */
export function buildActivityDeps(
  overrides?: ActivityDepsOverrides,
): ActivityDeps {
  // アダプタの構築（オーバーライド対応）
  const translationJobQueue =
    overrides?.adapters?.translationJobQueue ?? new SqsTranslationJobAdapter()

  // リポジトリの構築
  const activityQueryRepository = new DrizzleActivityQueryRepository()
  const translationStateRepository =
    new DrizzleActivityTranslationStateRepository()

  // UseCaseの構築（オーバーライド対応）
  return {
    adapters: {
      translationJobQueue,
    },
    useCases: {
      listUserActivities:
        overrides?.useCases?.listUserActivities ??
        new ListUserActivitiesUseCase(activityQueryRepository),
      getActivityDetail:
        overrides?.useCases?.getActivityDetail ??
        new GetActivityDetailUseCase(activityQueryRepository),
      listDataSourceActivities:
        overrides?.useCases?.listDataSourceActivities ??
        new ListDataSourceActivitiesUseCase(activityQueryRepository),
      requestActivityTranslation:
        overrides?.useCases?.requestActivityTranslation ??
        new RequestActivityTranslationUseCase(
          translationStateRepository,
          translationJobQueue,
        ),
      getActivityTranslationStatus:
        overrides?.useCases?.getActivityTranslationStatus ??
        new GetActivityTranslationStatusUseCase(translationStateRepository),
    },
  }
}
