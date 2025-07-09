import type { DataSource, Repository, UserWatch } from "../domain"
import { DATA_SOURCE_TYPES } from "../domain"
import type {
  DataSourceRepository,
  RepositoryRepository,
  UserWatchRepository,
} from "../repositories"
import type { UserRepository } from "../../user/repositories/user.repository"
import {
  DuplicateDataSourceError,
  UserNotFoundError,
  InvalidRepositoryUrlError,
} from "../errors"
import type { GitHubApiServiceInterface } from "./interfaces/github-api-service.interface"
import { createGitHubApiService } from "./github-api-service.factory"

/**
 * データソース作成サービスの入力DTO
 */
export type CreateDataSourceInputDto = {
  repositoryUrl: string
  userId: string
  name?: string
  description?: string
  notificationEnabled?: boolean
  watchReleases?: boolean
  watchIssues?: boolean
  watchPullRequests?: boolean
}

/**
 * データソース作成サービスの出力DTO
 */
export type CreateDataSourceOutputDto = {
  dataSource: DataSource
  repository: Repository
  userWatch: UserWatch
}

/**
 * データソース作成サービス
 * GitHub リポジトリ URL からデータソース、リポジトリ、ユーザーウォッチを作成
 */
export class DataSourceCreationService {
  constructor(
    private dataSourceRepository: DataSourceRepository,
    private repositoryRepository: RepositoryRepository,
    private userWatchRepository: UserWatchRepository,
    private userRepository: UserRepository,
    private githubApiService?: GitHubApiServiceInterface,
  ) {
    // githubApiServiceが指定されていない場合はファクトリ関数を使用
    if (!this.githubApiService) {
      this.githubApiService = createGitHubApiService()
    }
  }

  /**
   * GitHub リポジトリ URL からデータソースを作成
   */
  async execute(
    input: CreateDataSourceInputDto,
  ): Promise<CreateDataSourceOutputDto> {
    // GitHub URL から owner/repo を抽出
    const { owner, repo } = this.parseGitHubUrl(input.repositoryUrl)

    // GitHub API でリポジトリ情報を取得
    const githubRepo = await this.githubApiService!.getRepository(owner, repo)

    // 重複チェック
    const existingDataSource =
      await this.dataSourceRepository.findBySourceTypeAndId(
        DATA_SOURCE_TYPES.GITHUB,
        githubRepo.id.toString(),
      )

    if (existingDataSource) {
      throw new DuplicateDataSourceError(
        `Repository ${githubRepo.full_name} is already registered`,
      )
    }

    // データソース作成
    const dataSource = await this.dataSourceRepository.save({
      sourceType: DATA_SOURCE_TYPES.GITHUB,
      sourceId: githubRepo.id.toString(),
      name: input.name || githubRepo.name,
      description: input.description || githubRepo.description || "",
      url: githubRepo.html_url,
      isPrivate: githubRepo.private,
    })

    // リポジトリ情報作成
    const repository = await this.repositoryRepository.save({
      dataSourceId: dataSource.id,
      githubId: githubRepo.id,
      fullName: githubRepo.full_name,
      language: githubRepo.language,
      starsCount: githubRepo.stargazers_count,
      forksCount: githubRepo.forks_count,
      openIssuesCount: githubRepo.open_issues_count,
      isFork: githubRepo.fork,
    })

    // Auth0 UserIDからユーザーのDBレコードを取得
    const user = await this.userRepository.findByAuth0Id(input.userId)
    if (!user) {
      throw new UserNotFoundError(input.userId)
    }

    // ユーザーウォッチ作成
    const userWatch = await this.userWatchRepository.save({
      userId: user.id,
      dataSourceId: dataSource.id,
      notificationEnabled: input.notificationEnabled ?? true,
      watchReleases: input.watchReleases ?? true,
      watchIssues: input.watchIssues ?? false,
      watchPullRequests: input.watchPullRequests ?? false,
    })

    return {
      dataSource,
      repository,
      userWatch,
    }
  }

  /**
   * GitHub URL から owner/repo を抽出
   */
  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const githubUrlPattern =
      /^https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\.git)?\/?$/
    const match = url.match(githubUrlPattern)

    if (!match) {
      throw new InvalidRepositoryUrlError(url)
    }

    const owner = match[1]
    const repo = match[2].replace(/\.git$/, "")

    return {
      owner,
      repo,
    }
  }
}
