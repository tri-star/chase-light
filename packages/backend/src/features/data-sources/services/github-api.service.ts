import { Octokit } from "@octokit/rest"
import { GitHubApiError } from "../errors"
import type {
  GitHubApiServiceInterface,
  GitHubRepositoryResponse,
  GitHubReleaseResponse,
  GitHubIssueResponse,
  GitHubPullRequestResponse,
} from "./interfaces/github-api-service.interface"

/**
 * GitHub API サービス
 * Octokit を使用してGitHub API と通信
 */
export class GitHubApiService implements GitHubApiServiceInterface {
  private octokit: Octokit

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken, // 未指定の場合は公開リポジトリのみアクセス可能
    })
  }

  /**
   * リポジトリ情報を取得
   */
  async getRepository(
    owner: string,
    repo: string,
  ): Promise<GitHubRepositoryResponse> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      })

      return response.data as GitHubRepositoryResponse
    } catch (error: unknown) {
      // Octokitエラーの型ガード
      if (this.isOctokitError(error)) {
        if (error.status === 404) {
          throw new GitHubApiError(
            `Repository ${owner}/${repo} not found or not accessible`,
            404,
          )
        }
        if (error.status === 403) {
          throw new GitHubApiError(
            "GitHub API rate limit exceeded or forbidden",
            403,
          )
        }
        throw new GitHubApiError(
          `GitHub API error: ${error.message}`,
          error.status,
        )
      }

      // その他のエラーの場合
      const fallbackError = error as { message?: string }
      throw new GitHubApiError(
        `GitHub API error: ${fallbackError.message || "Unknown error"}`,
        undefined,
      )
    }
  }

  /**
   * リポジトリのリリース一覧を取得
   */
  async getReleases(
    owner: string,
    repo: string,
    options?: { perPage?: number; page?: number },
  ): Promise<GitHubReleaseResponse[]> {
    try {
      const response = await this.octokit.rest.repos.listReleases({
        owner,
        repo,
        per_page: options?.perPage || 100,
        page: options?.page || 1,
      })

      return response.data as GitHubReleaseResponse[]
    } catch (error: unknown) {
      this.handleApiError(error, `releases for ${owner}/${repo}`)
    }
  }

  /**
   * リポジトリのIssue一覧を取得
   */
  async getIssues(
    owner: string,
    repo: string,
    options?: {
      state?: "open" | "closed" | "all"
      since?: string
      perPage?: number
      page?: number
    },
  ): Promise<GitHubIssueResponse[]> {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: options?.state || "all",
        since: options?.since,
        per_page: options?.perPage || 100,
        page: options?.page || 1,
      })

      // Pull Requestもissuesとして返ってくるため、除外する
      const issues = response.data.filter(
        (item) => !("pull_request" in item),
      ) as GitHubIssueResponse[]

      return issues
    } catch (error: unknown) {
      this.handleApiError(error, `issues for ${owner}/${repo}`)
    }
  }

  /**
   * リポジトリのPull Request一覧を取得
   */
  async getPullRequests(
    owner: string,
    repo: string,
    options?: {
      state?: "open" | "closed" | "all"
      since?: string
      perPage?: number
      page?: number
    },
  ): Promise<GitHubPullRequestResponse[]> {
    try {
      const response = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state: options?.state || "all",
        per_page: options?.perPage || 100,
        page: options?.page || 1,
      })

      // sinceパラメータはpulls.listではサポートされていないため、手動でフィルタリング
      let pullRequests = response.data as GitHubPullRequestResponse[]

      if (options?.since) {
        const sinceDate = new Date(options.since)
        pullRequests = pullRequests.filter(
          (pr) => new Date(pr.created_at) >= sinceDate,
        )
      }

      return pullRequests
    } catch (error: unknown) {
      this.handleApiError(error, `pull requests for ${owner}/${repo}`)
    }
  }

  /**
   * APIエラーハンドリングの共通処理
   */
  private handleApiError(error: unknown, resource: string): never {
    if (this.isOctokitError(error)) {
      if (error.status === 404) {
        throw new GitHubApiError(`${resource} not found or not accessible`, 404)
      }
      if (error.status === 403) {
        throw new GitHubApiError(
          "GitHub API rate limit exceeded or forbidden",
          403,
        )
      }
      throw new GitHubApiError(
        `GitHub API error: ${error.message}`,
        error.status,
      )
    }

    const fallbackError = error as { message?: string }
    throw new GitHubApiError(
      `GitHub API error: ${fallbackError.message || "Unknown error"}`,
      undefined,
    )
  }

  /**
   * Octokitエラーの型ガード
   */
  private isOctokitError(
    error: unknown,
  ): error is { status: number; message: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      "message" in error &&
      typeof (error as Record<string, unknown>).status === "number" &&
      typeof (error as Record<string, unknown>).message === "string"
    )
  }
}
