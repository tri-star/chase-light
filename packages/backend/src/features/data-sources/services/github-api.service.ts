import { Octokit } from "@octokit/rest"
import { GitHubApiError } from "../errors"
import type {
  GitHubApiServiceInterface,
  GitHubRepositoryResponse,
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
      const apiError = error as { status?: number; message?: string }
      if (apiError.status === 404) {
        throw new GitHubApiError(
          `Repository ${owner}/${repo} not found or not accessible`,
          404,
        )
      }
      if (apiError.status === 403) {
        throw new GitHubApiError(
          "GitHub API rate limit exceeded or forbidden",
          403,
        )
      }
      throw new GitHubApiError(
        `GitHub API error: ${apiError.message || "Unknown error"}`,
        apiError.status,
      )
    }
  }
}
