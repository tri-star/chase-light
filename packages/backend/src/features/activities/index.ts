import { createActivityPresentationRoutes } from "./presentation"
import { buildActivityDeps } from "./application"
import { SqsTranslationJobAdapter, TranslationJobQueueStub } from "./infra"

// 本番環境の依存関係を構築
const translationJobQueue = process.env.TRANSLATION_QUEUE_URL
  ? new SqsTranslationJobAdapter()
  : new TranslationJobQueueStub()

const activityRoutes = createActivityPresentationRoutes({
  adapters: {
    translationJobQueue,
  },
})

export default activityRoutes

export { createActivityPresentationRoutes, buildActivityDeps }

export type { ActivityDeps, ActivityDepsOverrides } from "./application"

export {
  ListUserActivitiesUseCase,
  ListDataSourceActivitiesUseCase,
  GetActivityDetailUseCase,
  RequestActivityTranslationUseCase,
  GetActivityTranslationStatusUseCase,
  ProcessActivityTranslationJobUseCase,
} from "./application/use-cases"

export {
  DrizzleActivityQueryRepository,
  DrizzleActivityTranslationStateRepository,
  SqsTranslationJobAdapter,
  BodyTranslationAdapter,
} from "./infra"

export * from "./domain"
