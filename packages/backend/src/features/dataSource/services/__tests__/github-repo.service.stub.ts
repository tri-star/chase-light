import type { IGitHubRepoService } from "../github-repo.service.interface"
import type { Repository } from "../../schemas/repository.schema"
import type { Release } from "../../schemas/release.schema"
import type { PullRequest } from "../../schemas/pull-request.schema"
import type { Issue } from "../../schemas/issue.schema"
import type {
  GitHubPullRequestOptions,
  GitHubIssueOptions,
} from "../../types/api-options"

/**
 * GitHub Repository Service Stub Implementation
 *
 * テスト用のスタブ実装
 * テストケース毎にレスポンスデータをカスタマイズ可能
 */
export class GitHubRepoServiceStub implements IGitHubRepoService {
  // テストケース毎にカスタマイズ可能なデータ
  private watchedRepositories: Repository[] = []
  private repositoryDetails: Record<string, Repository> = {}
  private releases: Record<string, Release[]> = {}
  private pullRequests: Record<string, PullRequest[]> = {}
  private issues: Record<string, Issue[]> = {}

  // エラーシミュレーション用
  private shouldThrowError: Record<string, Error | null> = {}

  // 実行時間シミュレーション用
  private executionDelay: number = 0

  /**
   * データ設定メソッド
   */
  setWatchedRepositories(repositories: Repository[]): void {
    this.watchedRepositories = repositories
  }

  setRepositoryDetails(
    owner: string,
    repo: string,
    repository: Repository,
  ): void {
    const key = `${owner}/${repo}`
    this.repositoryDetails[key] = repository
  }

  setRepositoryReleases(
    owner: string,
    repo: string,
    releases: Release[],
  ): void {
    const key = `${owner}/${repo}`
    this.releases[key] = releases
  }

  setRepositoryPullRequests(
    owner: string,
    repo: string,
    pullRequests: PullRequest[],
  ): void {
    const key = `${owner}/${repo}`
    this.pullRequests[key] = pullRequests
  }

  setRepositoryIssues(owner: string, repo: string, issues: Issue[]): void {
    const key = `${owner}/${repo}`
    this.issues[key] = issues
  }

  /**
   * エラーシミュレーション設定
   */
  setErrorForMethod(methodName: string, error: Error): void {
    this.shouldThrowError[methodName] = error
  }

  clearErrors(): void {
    this.shouldThrowError = {}
  }

  /**
   * 実行時間シミュレーション設定
   */
  setExecutionDelay(delayMs: number): void {
    this.executionDelay = delayMs
  }

  /**
   * リセットメソッド（各テスト前にクリア）
   */
  reset(): void {
    this.watchedRepositories = []
    this.repositoryDetails = {}
    this.releases = {}
    this.pullRequests = {}
    this.issues = {}
    this.shouldThrowError = {}
    this.executionDelay = 0
  }

  /**
   * IGitHubRepoService インターフェース実装
   */
  async getWatchedRepositories(): Promise<Repository[]> {
    await this.simulateDelay()

    const error = this.shouldThrowError["getWatchedRepositories"]
    if (error) throw error

    return [...this.watchedRepositories]
  }

  async getRepositoryDetails(owner: string, repo: string): Promise<Repository> {
    await this.simulateDelay()

    const error = this.shouldThrowError["getRepositoryDetails"]
    if (error) throw error

    const key = `${owner}/${repo}`
    const repository = this.repositoryDetails[key]

    if (!repository) {
      throw new Error(`Repository ${owner}/${repo} not found`)
    }

    return { ...repository }
  }

  async getRepositoryReleases(
    owner: string,
    repo: string,
    options?: { page?: number; perPage?: number },
  ): Promise<Release[]> {
    await this.simulateDelay()

    const error = this.shouldThrowError["getRepositoryReleases"]
    if (error) throw error

    const key = `${owner}/${repo}`
    const allReleases = this.releases[key] || []

    // ページネーション処理のシミュレーション
    if (options?.page || options?.perPage) {
      const page = options.page || 1
      const perPage = options.perPage || 30
      const startIndex = (page - 1) * perPage
      const endIndex = startIndex + perPage

      return allReleases.slice(startIndex, endIndex)
    }

    return [...allReleases]
  }

  async getRepositoryPullRequests(
    owner: string,
    repo: string,
    options?: GitHubPullRequestOptions,
  ): Promise<PullRequest[]> {
    await this.simulateDelay()

    const error = this.shouldThrowError["getRepositoryPullRequests"]
    if (error) throw error

    const key = `${owner}/${repo}`
    let allPullRequests = this.pullRequests[key] || []

    // stateフィルタリングのシミュレーション
    if (options?.state && options.state !== "all") {
      allPullRequests = allPullRequests.filter(
        (pr) => pr.state === options.state,
      )
    }

    // ページネーション処理のシミュレーション
    if (options?.page || options?.perPage) {
      const page = options.page || 1
      const perPage = options.perPage || 30
      const startIndex = (page - 1) * perPage
      const endIndex = startIndex + perPage

      return allPullRequests.slice(startIndex, endIndex)
    }

    return [...allPullRequests]
  }

  async getRepositoryIssues(
    owner: string,
    repo: string,
    options?: GitHubIssueOptions,
  ): Promise<Issue[]> {
    await this.simulateDelay()

    const error = this.shouldThrowError["getRepositoryIssues"]
    if (error) throw error

    const key = `${owner}/${repo}`
    let allIssues = this.issues[key] || []

    // stateフィルタリングのシミュレーション
    if (options?.state && options.state !== "all") {
      allIssues = allIssues.filter((issue) => issue.state === options.state)
    }

    // sinceフィルタリングのシミュレーション
    if (options?.since) {
      const sinceDate = new Date(options.since)
      allIssues = allIssues.filter(
        (issue) => new Date(issue.createdAt) >= sinceDate,
      )
    }

    // ページネーション処理のシミュレーション
    if (options?.page || options?.perPage) {
      const page = options.page || 1
      const perPage = options.perPage || 30
      const startIndex = (page - 1) * perPage
      const endIndex = startIndex + perPage

      return allIssues.slice(startIndex, endIndex)
    }

    return [...allIssues]
  }

  /**
   * プライベートヘルパーメソッド
   */
  private async simulateDelay(): Promise<void> {
    if (this.executionDelay > 0) {
      await new Promise((resolve) =>
        globalThis.setTimeout(resolve, this.executionDelay),
      )
    }
  }

  /**
   * デバッグ用メソッド
   */
  getSetupSummary(): Record<string, unknown> {
    return {
      watchedRepositoriesCount: this.watchedRepositories.length,
      repositoryDetailsCount: Object.keys(this.repositoryDetails).length,
      releasesCount: Object.keys(this.releases).length,
      pullRequestsCount: Object.keys(this.pullRequests).length,
      issuesCount: Object.keys(this.issues).length,
      errorMethods: Object.keys(this.shouldThrowError).filter(
        (key) => this.shouldThrowError[key],
      ),
      executionDelay: this.executionDelay,
    }
  }
}
