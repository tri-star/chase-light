import type { DataSource, Repository } from "../domain"
import { DATA_SOURCE_TYPES } from "../domain"
import type {
  DataSourceRepository,
  RepositoryRepository,
} from "../repositories"
import { InvalidRepositoryUrlError } from "../errors"
import type { GitHubApiServiceInterface } from "./interfaces/github-api-service.interface"
import { createGitHubApiService } from "./github-api-service.factory"
import { TransactionManager } from "../../../shared/db"

/**
 * データソース作成サービスの入力DTO
 */
export type CreateDataSourceInputDto = {
  repositoryUrl: string
  name?: string
  description?: string
}

/**
 * データソース作成サービスの出力DTO
 */
export type CreateDataSourceOutputDto = {
  dataSource: DataSource
  repository: Repository
}

/**
 * データソース作成サービス
 * GitHub リポジトリ URL からデータソースとリポジトリを作成
 */
export class DataSourceCreationService {
  constructor(
    private dataSourceRepository: DataSourceRepository,
    private repositoryRepository: RepositoryRepository,
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
    return await TransactionManager.transaction(async () => {
      // GitHub URL から owner/repo を抽出
      const { owner, repo } = this.parseGitHubUrl(input.repositoryUrl)

      // GitHub API でリポジトリ情報を取得
      const githubRepo = await this.githubApiService!.getRepository(owner, repo)

      // 重複チェック: 既存の場合は既存のレコードを返す
      const existingDataSource =
        await this.dataSourceRepository.findBySourceTypeAndId(
          DATA_SOURCE_TYPES.GITHUB,
          githubRepo.id.toString(),
        )

      if (existingDataSource) {
        // 既存のRepositoryも取得
        const existingRepository =
          await this.repositoryRepository.findByDataSourceId(
            existingDataSource.id,
          )
        if (!existingRepository) {
          throw new Error(
            `Repository record not found for dataSource ${existingDataSource.id}`,
          )
        }

        return {
          dataSource: existingDataSource,
          repository: existingRepository,
        }
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

      return {
        dataSource,
        repository,
      }
    })
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
