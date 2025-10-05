import {
  DrizzleDataSourceRepository,
  DrizzleUserWatchRepository,
  DrizzleUserAccountRepository,
  createGitHubRepositoryPort,
} from "./infra"
import {
  RegisterDataSourceWatchUseCase,
  ListDataSourcesUseCase,
  GetDataSourceUseCase,
  UpdateDataSourceUseCase,
  RemoveDataSourceWatchUseCase,
} from "./application/use-cases"
import { listDataSourceActivitiesUseCase } from "../activities"
import { createDataSourcePresentationRoutes } from "./presentation"

const dataSourceRepository = new DrizzleDataSourceRepository()
const userWatchRepository = new DrizzleUserWatchRepository()
const userAccountRepository = new DrizzleUserAccountRepository()
const githubRepositoryPort = createGitHubRepositoryPort()

const registerDataSourceWatchUseCase = new RegisterDataSourceWatchUseCase(
  dataSourceRepository,
  userWatchRepository,
  userAccountRepository,
  githubRepositoryPort,
)

const listDataSourcesUseCase = new ListDataSourcesUseCase(
  dataSourceRepository,
  userAccountRepository,
)

const getDataSourceUseCase = new GetDataSourceUseCase(
  dataSourceRepository,
  userAccountRepository,
)

const updateDataSourceUseCase = new UpdateDataSourceUseCase(
  dataSourceRepository,
  userWatchRepository,
  userAccountRepository,
)

const removeDataSourceWatchUseCase = new RemoveDataSourceWatchUseCase(
  dataSourceRepository,
  userAccountRepository,
)

const dataSourceRoutes = createDataSourcePresentationRoutes(
  registerDataSourceWatchUseCase,
  listDataSourcesUseCase,
  getDataSourceUseCase,
  updateDataSourceUseCase,
  removeDataSourceWatchUseCase,
  listDataSourceActivitiesUseCase,
)

export default dataSourceRoutes

export { createDataSourcePresentationRoutes } from "./presentation"

export * from "./domain"
export * from "./application/use-cases"
export * from "./presentation/shared/error-handling"
