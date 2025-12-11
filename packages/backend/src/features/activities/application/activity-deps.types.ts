import type { TranslationJobQueuePort } from "./ports/translation-job-queue.port"
import type {
  ListUserActivitiesUseCase,
  GetActivityDetailUseCase,
  ListDataSourceActivitiesUseCase,
  RequestActivityTranslationUseCase,
  GetActivityTranslationStatusUseCase,
} from "./use-cases"

/**
 * Activity フィーチャーで利用する外部アダプタの型定義
 */
export type ActivityAdapters = {
  translationJobQueue: TranslationJobQueuePort
}

/**
 * Activity フィーチャーで利用する UseCase の型定義
 */
export type ActivityUseCases = {
  listUserActivities: ListUserActivitiesUseCase
  getActivityDetail: GetActivityDetailUseCase
  listDataSourceActivities: ListDataSourceActivitiesUseCase
  requestActivityTranslation: RequestActivityTranslationUseCase
  getActivityTranslationStatus: GetActivityTranslationStatusUseCase
}

/**
 * Activity フィーチャーの全依存関係をまとめた型
 */
export type ActivityDeps = {
  adapters: ActivityAdapters
  useCases: ActivityUseCases
}

/**
 * Activity フィーチャーの依存関係をオーバーライドするための型
 */
export type ActivityDepsOverrides = {
  adapters?: Partial<ActivityAdapters>
  useCases?: Partial<ActivityUseCases>
}
