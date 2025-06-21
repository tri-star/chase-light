import { Octokit } from "@octokit/rest"
import type { IGitHubRepoService } from "./github-repo.service.interface"
import type {
  Repository,
  Release,
  PullRequest,
  Issue,
  RepositoryOwner,
  License,
  Label,
  Milestone,
  GitHubPullRequestOptions,
  GitHubIssueOptions,
  ReleaseAsset,
  PullRequestBranch,
} from "../types"
import {
  GitHubApiError,
  GitHubRateLimitError,
  GitHubAuthenticationError,
} from "../types"

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

      return response.data.map(this.mapToRepository)
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

      return this.mapToRepository(response.data)
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

      return response.data.map(this.mapToRelease)
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

      return response.data.map(this.mapToPullRequest)
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

      return issues.map(this.mapToIssue)
    } catch (error) {
      throw this.handleApiError(error)
    }
  }

  /**
   * GitHub API Repository レスポンスを内部Repository型にマッピング
   */
  private mapToRepository(apiRepo: unknown): Repository {
    const repo = apiRepo as Record<string, unknown>
    return {
      id: repo.id as number,
      name: repo.name as string,
      fullName: repo.full_name as string,
      description: repo.description as string | null,
      htmlUrl: repo.html_url as string,
      cloneUrl: repo.clone_url as string,
      stargazersCount: repo.stargazers_count as number,
      watchersCount: repo.watchers_count as number,
      forksCount: repo.forks_count as number,
      language: repo.language as string | null,
      topics: (repo.topics as string[]) || [],
      isPrivate: repo.private as boolean,
      isFork: repo.fork as boolean,
      isArchived: repo.archived as boolean,
      defaultBranch: repo.default_branch as string,
      createdAt: repo.created_at as string,
      updatedAt: repo.updated_at as string,
      pushedAt: repo.pushed_at as string | null,
      owner: this.mapToRepositoryOwner(repo.owner),
      license: repo.license ? this.mapToLicense(repo.license) : null,
    }
  }

  /**
   * GitHub API Release レスポンスを内部Release型にマッピング
   */
  private mapToRelease(apiRelease: unknown): Release {
    const release = apiRelease as Record<string, unknown>
    return {
      id: release.id as number,
      tagName: release.tag_name as string,
      name: release.name as string | null,
      body: release.body as string | null,
      isDraft: release.draft as boolean,
      isPrerelease: release.prerelease as boolean,
      createdAt: release.created_at as string,
      publishedAt: release.published_at as string | null,
      htmlUrl: release.html_url as string,
      tarballUrl: release.tarball_url as string | null,
      zipballUrl: release.zipball_url as string | null,
      author: this.mapToRepositoryOwner(release.author),
      assets: ((release.assets as unknown[]) || []).map(this.mapToReleaseAsset),
    }
  }

  /**
   * GitHub API Pull Request レスポンスを内部PullRequest型にマッピング
   */
  private mapToPullRequest(apiPr: unknown): PullRequest {
    const pr = apiPr as Record<string, unknown>
    return {
      id: pr.id as number,
      number: pr.number as number,
      title: pr.title as string,
      body: pr.body as string | null,
      state: pr.state as "open" | "closed",
      isDraft: pr.draft as boolean,
      isMerged: (pr.merged as boolean) || false,
      createdAt: pr.created_at as string,
      updatedAt: pr.updated_at as string,
      closedAt: pr.closed_at as string | null,
      mergedAt: pr.merged_at as string | null,
      htmlUrl: pr.html_url as string,
      head: this.mapToPullRequestBranch(pr.head),
      base: this.mapToPullRequestBranch(pr.base),
      user: this.mapToRepositoryOwner(pr.user),
      assignees: ((pr.assignees as unknown[]) || []).map(
        this.mapToRepositoryOwner,
      ),
      reviewers: ((pr.requested_reviewers as unknown[]) || []).map(
        this.mapToRepositoryOwner,
      ),
      labels: ((pr.labels as unknown[]) || []).map(this.mapToLabel),
    }
  }

  /**
   * GitHub API Issue レスポンスを内部Issue型にマッピング
   */
  private mapToIssue(apiIssue: unknown): Issue {
    const issue = apiIssue as Record<string, unknown>
    return {
      id: issue.id as number,
      number: issue.number as number,
      title: issue.title as string,
      body: issue.body as string | null,
      state: issue.state as "open" | "closed",
      createdAt: issue.created_at as string,
      updatedAt: issue.updated_at as string,
      closedAt: issue.closed_at as string | null,
      htmlUrl: issue.html_url as string,
      user: this.mapToRepositoryOwner(issue.user),
      assignees: ((issue.assignees as unknown[]) || []).map(
        this.mapToRepositoryOwner,
      ),
      labels: ((issue.labels as unknown[]) || []).map(this.mapToLabel),
      milestone: issue.milestone ? this.mapToMilestone(issue.milestone) : null,
      comments: issue.comments as number,
      isPullRequest: !!issue.pull_request,
    }
  }

  /**
   * 共通マッピング関数群
   */
  private mapToRepositoryOwner = (apiOwner: unknown): RepositoryOwner => {
    const owner = apiOwner as Record<string, unknown>
    return {
      login: owner.login as string,
      id: owner.id as number,
      avatarUrl: owner.avatar_url as string,
      htmlUrl: owner.html_url as string,
      type: owner.type as "User" | "Organization",
    }
  }

  private mapToLicense = (apiLicense: unknown): License => {
    const license = apiLicense as Record<string, unknown>
    return {
      key: license.key as string,
      name: license.name as string,
      spdxId: license.spdx_id as string | null,
      url: license.url as string | null,
    }
  }

  private mapToReleaseAsset = (apiAsset: unknown): ReleaseAsset => {
    const asset = apiAsset as Record<string, unknown>
    return {
      id: asset.id as number,
      name: asset.name as string,
      label: asset.label as string | null,
      contentType: asset.content_type as string,
      size: asset.size as number,
      downloadCount: asset.download_count as number,
      createdAt: asset.created_at as string,
      updatedAt: asset.updated_at as string,
      browserDownloadUrl: asset.browser_download_url as string,
    }
  }

  private mapToPullRequestBranch = (apiBranch: unknown): PullRequestBranch => {
    const branch = apiBranch as Record<string, unknown>
    return {
      ref: branch.ref as string,
      sha: branch.sha as string,
      label: branch.label as string,
      repo: branch.repo ? this.mapToRepository(branch.repo) : null,
    }
  }

  private mapToLabel = (apiLabel: unknown): Label => {
    const label = apiLabel as Record<string, unknown>
    return {
      id: label.id as number,
      name: label.name as string,
      description: label.description as string | null,
      color: label.color as string,
    }
  }

  private mapToMilestone = (apiMilestone: unknown): Milestone => {
    const milestone = apiMilestone as Record<string, unknown>
    return {
      id: milestone.id as number,
      number: milestone.number as number,
      title: milestone.title as string,
      description: milestone.description as string | null,
      state: milestone.state as "open" | "closed",
      createdAt: milestone.created_at as string,
      updatedAt: milestone.updated_at as string,
      dueOn: milestone.due_on as string | null,
      closedAt: milestone.closed_at as string | null,
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
