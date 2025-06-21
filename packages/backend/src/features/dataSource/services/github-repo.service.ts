import { Octokit } from "@octokit/rest"
import type { IGitHubRepoService } from "./github-repo.service.interface"
import type {
  GitHubPullRequestOptions,
  GitHubIssueOptions,
} from "../types/api-options"
import {
  GitHubApiError,
  GitHubRateLimitError,
  GitHubAuthenticationError,
} from "../errors/github-api.error"
import { type Repository } from "../schemas/repository.schema"
import { type Release } from "../schemas/release.schema"
import { type PullRequest } from "../schemas/pull-request.schema"
import { type Issue } from "../schemas/issue.schema"
import { GitHubApiParser } from "../parsers/github-api.parser"

/**
 * GitHub Repository Service - Production Implementation
 *
 * Octokitを使用したGitHub APIとの実際の連携を行う実装
 */
export class GitHubRepoService implements IGitHubRepoService {
  private octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
      userAgent: "ChaseLight-Backend/1.0.0",
      timeZone: "Asia/Tokyo",
    })
  }

  async getWatchedRepositories(_username: string): Promise<Repository[]> {
    try {
      const response =
        await this.octokit.rest.activity.listWatchedReposForAuthenticatedUser({
          per_page: 100,
        })

      return response.data.map((apiRepo) =>
        GitHubApiParser.parseRepository(apiRepo),
      )
    } catch (error) {
      throw this.handleApiError(error)
    }
  }

  async getRepositoryDetails(owner: string, repo: string): Promise<Repository> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      })

      return GitHubApiParser.parseRepository(response.data)
    } catch (error) {
      throw this.handleApiError(error)
    }
  }

  async getRepositoryReleases(
    owner: string,
    repo: string,
    options?: { page?: number; perPage?: number },
  ): Promise<Release[]> {
    try {
      const response = await this.octokit.rest.repos.listReleases({
        owner,
        repo,
        page: options?.page || 1,
        per_page: options?.perPage || 30,
      })

      return response.data.map((apiRelease) =>
        GitHubApiParser.parseRelease(apiRelease),
      )
    } catch (error) {
      throw this.handleApiError(error)
    }
  }

  async getRepositoryPullRequests(
    owner: string,
    repo: string,
    options?: GitHubPullRequestOptions,
  ): Promise<PullRequest[]> {
    try {
      const response = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state: options?.state || "open",
        sort: options?.sort || "created",
        direction: options?.direction || "desc",
        page: options?.page || 1,
        per_page: options?.perPage || 30,
      })

      return response.data.map((apiPr) =>
        GitHubApiParser.parsePullRequest(apiPr),
      )
    } catch (error) {
      throw this.handleApiError(error)
    }
  }

  async getRepositoryIssues(
    owner: string,
    repo: string,
    options?: GitHubIssueOptions,
  ): Promise<Issue[]> {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: options?.state || "open",
        sort: options?.sort || "created",
        direction: options?.direction || "desc",
        since: options?.since,
        page: options?.page || 1,
        per_page: options?.perPage || 30,
      })

      // Pull Requestを除外（GitHubのIssue APIはPRも含むため）
      const issues = response.data.filter((issue) => !issue.pull_request)

      return issues.map((apiIssue) => GitHubApiParser.parseIssue(apiIssue))
    } catch (error) {
      throw this.handleApiError(error)
    }
  }

  /**
   * GitHub API エラーハンドリング
   */
  private handleApiError(error: unknown): Error {
    const apiError = error as Record<string, unknown>
    if (apiError.status === 401) {
      return new GitHubAuthenticationError("GitHub authentication failed")
    }

    if (apiError.status === 403) {
      const response = apiError.response as Record<string, unknown>
      const headers = response?.headers as Record<string, unknown>
      const resetTime = headers?.["x-ratelimit-reset"] as string
      const remaining = headers?.["x-ratelimit-remaining"] as string

      if (resetTime) {
        return new GitHubRateLimitError(
          "GitHub API rate limit exceeded",
          new Date(parseInt(resetTime) * 1000),
          parseInt(remaining) || 0,
        )
      }
    }

    if (apiError.status === 404) {
      return new GitHubApiError("Resource not found", 404, apiError.response)
    }

    return new GitHubApiError(
      (apiError.message as string) || "GitHub API error occurred",
      (apiError.status as number) || 500,
      apiError.response,
    )
  }
}
