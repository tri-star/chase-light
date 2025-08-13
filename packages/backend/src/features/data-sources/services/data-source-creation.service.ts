import type { GitHubDataSource, DataSourceCreationInput } from "../domain"
import { DATA_SOURCE_TYPES } from "../domain"
import type { DataSourceRepository } from "../repositories"
import { InvalidRepositoryUrlError } from "../errors"
import type { GitHubApiServiceInterface } from "./interfaces/github-api-service.interface"
import { createGitHubApiService } from "./github-api-service.factory"

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
 * GitHubDataSourceにはrepository情報が内包されている
 */
export type CreateDataSourceOutputDto = {
  dataSource: GitHubDataSource
}

/**
 * データソース作成サービス
 * GitHub リポジトリ URL からGitHubDataSource（repository内包）を作成
 */
export class DataSourceCreationService {
  constructor(
    private dataSourceRepository: DataSourceRepository,
    private githubApiService?: GitHubApiServiceInterface,
  ) {
    // githubApiServiceが指定されていない場合はファクトリ関数を使用
    if (!this.githubApiService) {
      this.githubApiService = createGitHubApiService()
    }
  }

  /**
   * GitHub リポジトリ URL からGitHubDataSource（repository内包）を作成
   */
  async execute(
    input: CreateDataSourceInputDto,
  ): Promise<CreateDataSourceOutputDto> {
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
      // 既存のGitHubDataSource（repository内包）を返す
      return {
        dataSource: existingDataSource,
      }
    }

    // 新しいGitHubDataSource（repository内包）を作成
    const dataSourceInput: DataSourceCreationInput = {
      sourceType: DATA_SOURCE_TYPES.GITHUB,
      sourceId: githubRepo.id.toString(),
      name: input.name || githubRepo.name,
      description: input.description || githubRepo.description || "",
      url: githubRepo.html_url,
      isPrivate: githubRepo.private,
      repository: {
        githubId: githubRepo.id,
        fullName: githubRepo.full_name,
        language: githubRepo.language,
        starsCount: githubRepo.stargazers_count,
        forksCount: githubRepo.forks_count,
        openIssuesCount: githubRepo.open_issues_count,
        isFork: githubRepo.fork,
      },
    }

    // DataSourceRepositoryが内部的にトランザクションを処理し、
    // data_sourcesとrepositoriesの両方のテーブルを更新
    const dataSource = await this.dataSourceRepository.save(dataSourceInput)

    return {
      dataSource: dataSource,
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
