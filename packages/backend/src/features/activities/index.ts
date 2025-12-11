import { DrizzleActivityQueryRepository } from "./infra"
import {
  GetActivityDetailUseCase,
  GetActivityTranslationStatusUseCase,
  ListDataSourceActivitiesUseCase,
  ListUserActivitiesUseCase,
  ProcessActivityTranslationJobUseCase,
  RequestActivityTranslationUseCase,
} from "./application/use-cases"
import { createActivityPresentationRoutes } from "./presentation"
import {
  DrizzleActivityTranslationStateRepository,
  SqsTranslationJobAdapter,
  BodyTranslationAdapter,
  TranslationJobQueueStub,
} from "./infra"

const activityQueryRepository = new DrizzleActivityQueryRepository()
const activityTranslationStateRepository =
  new DrizzleActivityTranslationStateRepository()
const translationJobQueue = process.env.TRANSLATION_QUEUE_URL
  ? new SqsTranslationJobAdapter()
  : new TranslationJobQueueStub()

const listUserActivitiesUseCase = new ListUserActivitiesUseCase(
  activityQueryRepository,
)
const listDataSourceActivitiesUseCase = new ListDataSourceActivitiesUseCase(
  activityQueryRepository,
)
const getActivityDetailUseCase = new GetActivityDetailUseCase(
  activityQueryRepository,
)
const requestActivityTranslationUseCase = new RequestActivityTranslationUseCase(
  activityTranslationStateRepository,
  translationJobQueue,
)
const getActivityTranslationStatusUseCase =
  new GetActivityTranslationStatusUseCase(activityTranslationStateRepository)

const activityRoutes = createActivityPresentationRoutes(
  listUserActivitiesUseCase,
  getActivityDetailUseCase,
  listDataSourceActivitiesUseCase,
  requestActivityTranslationUseCase,
  getActivityTranslationStatusUseCase,
)

export default activityRoutes

export {
  createActivityPresentationRoutes,
  ListUserActivitiesUseCase,
  ListDataSourceActivitiesUseCase,
  GetActivityDetailUseCase,
  RequestActivityTranslationUseCase,
  GetActivityTranslationStatusUseCase,
  ProcessActivityTranslationJobUseCase,
  DrizzleActivityQueryRepository,
  DrizzleActivityTranslationStateRepository,
  SqsTranslationJobAdapter,
  BodyTranslationAdapter,
}

export * from "./domain"
