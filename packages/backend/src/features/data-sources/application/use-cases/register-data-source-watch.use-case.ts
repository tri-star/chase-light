import { TransactionManager } from "../../../../core/db"
import {
  DATA_SOURCE_TYPES,
  type DataSource,
  type DataSourceCreationInput,
  type GitHubDataSource,
  type UserWatch,
} from "../../domain"
import type {
  DataSourceRepository,
  UserWatchRepository,
  UserAccountRepository,
} from "../../domain/repositories"
import { InvalidRepositoryUrlError, UserNotFoundError } from "../../errors"
import type {
  GitHubRepositoryDto,
  GitHubRepositoryPort,
} from "../ports/github-repository.port"
import { parseGitHubRepositoryUrl } from "shared"

export type RegisterDataSourceWatchInput = {
  repositoryUrl: string
  userId: string
  name?: string
  description?: string
  notificationEnabled?: boolean
  watchReleases?: boolean
  watchIssues?: boolean
  watchPullRequests?: boolean
}

export type RegisterDataSourceWatchOutput = {
  dataSource: GitHubDataSource
  userWatch: UserWatch
}

export class RegisterDataSourceWatchUseCase {
  constructor(
    private readonly dataSourceRepository: DataSourceRepository,
    private readonly userWatchRepository: UserWatchRepository,
    private readonly userAccountRepository: UserAccountRepository,
    private readonly githubRepositoryPort: GitHubRepositoryPort,
  ) {}

  async execute(
    input: RegisterDataSourceWatchInput,
  ): Promise<RegisterDataSourceWatchOutput> {
    return await TransactionManager.transaction(async () => {
      const parsedUrl = parseGitHubRepositoryUrl(input.repositoryUrl)

      if (!parsedUrl) {
        throw new InvalidRepositoryUrlError(input.repositoryUrl)
      }

      const { owner, repo } = parsedUrl

      const githubRepository = await this.githubRepositoryPort.getRepository(
        owner,
        repo,
      )

      const existingDataSource =
        await this.dataSourceRepository.findBySourceTypeAndId(
          DATA_SOURCE_TYPES.GITHUB,
          githubRepository.id.toString(),
        )

      const dataSource =
        existingDataSource ??
        (await this.dataSourceRepository.save(
          this.buildCreationInput(githubRepository, input),
        ))

      const githubDataSource = this.ensureGitHubDataSource(dataSource)

      const user = await this.userAccountRepository.findByAuth0Id(input.userId)
      if (!user) {
        throw new UserNotFoundError(input.userId)
      }

      const existingWatch =
        await this.userWatchRepository.findByUserAndDataSource(
          user.id,
          githubDataSource.id,
        )

      if (existingWatch) {
        const updatedWatch =
          await this.userWatchRepository.updateByUserAndDataSource(
            user.id,
            githubDataSource.id,
            {
              notificationEnabled: input.notificationEnabled,
              watchReleases: input.watchReleases,
              watchIssues: input.watchIssues,
              watchPullRequests: input.watchPullRequests,
            },
          )

        if (!updatedWatch) {
          throw new Error(
            `Failed to update UserWatch for userId: ${user.id} and dataSourceId: ${githubDataSource.id}`,
          )
        }

        return {
          dataSource: githubDataSource,
          userWatch: updatedWatch,
        }
      }

      const userWatch = await this.userWatchRepository.save({
        userId: user.id,
        dataSourceId: githubDataSource.id,
        notificationEnabled: input.notificationEnabled ?? true,
        watchReleases: input.watchReleases ?? true,
        watchIssues: input.watchIssues ?? false,
        watchPullRequests: input.watchPullRequests ?? false,
      })

      return {
        dataSource: githubDataSource,
        userWatch,
      }
    })
  }

  private buildCreationInput(
    repository: GitHubRepositoryDto,
    input: RegisterDataSourceWatchInput,
  ): DataSourceCreationInput {
    return {
      sourceType: DATA_SOURCE_TYPES.GITHUB,
      sourceId: repository.id.toString(),
      name: input.name ?? repository.name,
      description: input.description ?? repository.description ?? "",
      url: repository.htmlUrl,
      isPrivate: repository.private,
      repository: {
        githubId: repository.id,
        fullName: repository.fullName,
        language: repository.language,
        starsCount: repository.stargazersCount,
        forksCount: repository.forksCount,
        openIssuesCount: repository.openIssuesCount,
        isFork: repository.fork,
      },
    }
  }

  private ensureGitHubDataSource(dataSource: DataSource): GitHubDataSource {
    if (dataSource.sourceType !== DATA_SOURCE_TYPES.GITHUB) {
      throw new Error(`Unsupported data source type: ${dataSource.sourceType}`)
    }
    return dataSource
  }
}
