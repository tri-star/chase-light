import { TransactionManager } from "../../../../core/db"
import {
  DATA_SOURCE_TYPES,
  type DataSource,
  type GitHubDataSource,
  type UserWatch,
} from "../../domain"
import type {
  DataSourceRepository,
  UserWatchRepository,
  UserAccountRepository,
} from "../../domain/repositories"
import { DataSourceNotFoundError, UserNotFoundError } from "../../errors"

export type UpdateDataSourceInput = {
  dataSourceId: string
  userId: string
  name?: string
  description?: string
  notificationEnabled?: boolean
  watchReleases?: boolean
  watchIssues?: boolean
  watchPullRequests?: boolean
}

export type UpdateDataSourceOutput = {
  dataSource: GitHubDataSource
  userWatch: UserWatch
}

export class UpdateDataSourceUseCase {
  constructor(
    private readonly dataSourceRepository: DataSourceRepository,
    private readonly userWatchRepository: UserWatchRepository,
    private readonly userAccountRepository: UserAccountRepository,
  ) {}

  async execute(input: UpdateDataSourceInput): Promise<UpdateDataSourceOutput> {
    return await TransactionManager.transaction(async () => {
      const user = await this.userAccountRepository.findByAuth0Id(input.userId)
      if (!user) {
        throw new UserNotFoundError(input.userId)
      }

      const current = await this.dataSourceRepository.findByIdWithUserAccess(
        input.dataSourceId,
        user.id,
      )

      if (!current) {
        throw new DataSourceNotFoundError(input.dataSourceId)
      }

      const updatedDataSource =
        input.name !== undefined || input.description !== undefined
          ? await this.dataSourceRepository.updateByIdWithUserAccess(
              input.dataSourceId,
              user.id,
              {
                name: input.name,
                description: input.description,
              },
            )
          : current.dataSource

      const dataSource = this.ensureGitHubDataSource(
        updatedDataSource ?? current.dataSource,
      )

      const updatedWatch =
        input.notificationEnabled !== undefined ||
        input.watchReleases !== undefined ||
        input.watchIssues !== undefined ||
        input.watchPullRequests !== undefined
          ? await this.userWatchRepository.updateByUserAndDataSource(
              user.id,
              input.dataSourceId,
              {
                notificationEnabled: input.notificationEnabled,
                watchReleases: input.watchReleases,
                watchIssues: input.watchIssues,
                watchPullRequests: input.watchPullRequests,
              },
            )
          : current.userWatch

      const userWatch = updatedWatch ?? current.userWatch

      return {
        dataSource,
        userWatch,
      }
    })
  }

  private ensureGitHubDataSource(dataSource: DataSource): GitHubDataSource {
    if (dataSource.sourceType !== DATA_SOURCE_TYPES.GITHUB) {
      throw new Error(`Unsupported data source type: ${dataSource.sourceType}`)
    }
    return dataSource
  }
}
