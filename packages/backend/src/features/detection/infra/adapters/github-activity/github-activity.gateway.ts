import { Octokit } from "@octokit/rest"
import type {
  GitHubReleaseResponse,
  GitHubIssueResponse,
  GitHubPullRequestResponse,
  GitHubActivityGateway as GitHubActivityGatewayInterface,
} from "../../../application/ports/github-activity.gateway"
import { handleApiError } from "../../../../shared/github/github-api-error-utils"

/**
 * GitHub API サービス
 * Octokit を使用してGitHub API と通信
 */
export class GitHubActivityGateway implements GitHubActivityGatewayInterface {
  private octokit: Octokit

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken, // 未指定の場合は公開リポジトリのみアクセス可能
    })
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
      handleApiError(error, `releases for ${owner}/${repo}`)
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
        (item) => item.pull_request === undefined,
      ) as GitHubIssueResponse[]

      return issues
    } catch (error: unknown) {
      handleApiError(error, `issues for ${owner}/${repo}`)
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
      // sinceパラメータはpulls.listではサポートされていないため、ページネーションで取得し、since日付より古いPRが見つかった時点でbreakする
      // APIリクエスト数を最小化するための最適化
      const perPage = options?.perPage || 100
      const state = options?.state || "all"
      const sinceDate = options?.since ? new Date(options.since) : undefined
      let page = 1
      let allPRs: GitHubPullRequestResponse[] = []
      let shouldContinue = true

      while (shouldContinue) {
        const response = await this.octokit.rest.pulls.list({
          owner,
          repo,
          state,
          per_page: perPage,
          page,
        })
        const prs = response.data as GitHubPullRequestResponse[]
        if (sinceDate) {
          for (const pr of prs) {
            if (new Date(pr.created_at) < sinceDate) {
              // since日付より古いPRが見つかったらbreak
              shouldContinue = false
              break
            }
            allPRs.push(pr)
          }
        } else {
          allPRs = allPRs.concat(prs)
        }
        // ページにPRが満たない場合は終了
        if (prs.length < perPage) {
          break
        }
        page++
      }
      return allPRs
    } catch (error: unknown) {
      handleApiError(error, `pull requests for ${owner}/${repo}`)
    }
  }
}
