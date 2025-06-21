import { z } from "zod/v4"
import {
  githubRepositoryApiSchema,
  repositorySchema,
  type Repository,
  githubRepositoryOwnerApiSchema,
  repositoryOwnerSchema,
  type RepositoryOwner,
  githubLicenseApiSchema,
  licenseSchema,
  type License,
} from "../schemas/repository.schema"
import {
  githubPullRequestApiSchema,
  pullRequestSchema,
  type PullRequest,
  githubPullRequestBranchApiSchema,
  pullRequestBranchSchema,
  type PullRequestBranch,
} from "../schemas/pull-request.schema"
import {
  githubIssueApiSchema,
  issueSchema,
  type Issue,
  githubLabelApiSchema,
  labelSchema,
  type Label,
  githubMilestoneApiSchema,
  milestoneSchema,
  type Milestone,
} from "../schemas/issue.schema"
import {
  githubReleaseApiSchema,
  releaseSchema,
  type Release,
  githubReleaseAssetApiSchema,
  releaseAssetSchema,
  type ReleaseAsset,
} from "../schemas/release.schema"
import { GitHubApiParseError } from "../errors/github-parse.error"

/**
 * GitHub API Parser
 * GitHub APIのレスポンスを内部のドメインオブジェクトに変換するパーサー
 */
export class GitHubApiParser {
  /**
   * Repository API Response -> Repository
   */
  static parseRepository(apiData: unknown): Repository {
    try {
      // 1. GitHub APIレスポンスの形式でパース
      const githubRepo = githubRepositoryApiSchema.parse(apiData)

      // 2. 内部オブジェクト形式に変換
      const repository: Repository = {
        id: githubRepo.id,
        name: githubRepo.name,
        fullName: githubRepo.full_name,
        description: githubRepo.description,
        htmlUrl: githubRepo.html_url,
        cloneUrl: githubRepo.clone_url,
        stargazersCount: githubRepo.stargazers_count,
        watchersCount: githubRepo.watchers_count,
        forksCount: githubRepo.forks_count,
        language: githubRepo.language,
        topics: githubRepo.topics,
        isPrivate: githubRepo.private,
        isFork: githubRepo.fork,
        isArchived: githubRepo.archived,
        defaultBranch: githubRepo.default_branch,
        createdAt: githubRepo.created_at,
        updatedAt: githubRepo.updated_at,
        pushedAt: githubRepo.pushed_at,
        owner: this.parseRepositoryOwner(githubRepo.owner),
        license: githubRepo.license
          ? this.parseLicense(githubRepo.license)
          : null,
      }

      // 3. 内部スキーマでの最終検証
      return repositorySchema.parse(repository)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub Repository APIレスポンスのパースに失敗しました",
          error,
          apiData,
        )
      }
      throw error
    }
  }

  /**
   * Repository Owner API Response -> RepositoryOwner
   */
  static parseRepositoryOwner(apiData: unknown): RepositoryOwner {
    try {
      const githubOwner = githubRepositoryOwnerApiSchema.parse(apiData)

      const owner: RepositoryOwner = {
        login: githubOwner.login,
        id: githubOwner.id,
        avatarUrl: githubOwner.avatar_url,
        htmlUrl: githubOwner.html_url,
        type: githubOwner.type,
      }

      return repositoryOwnerSchema.parse(owner)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub RepositoryOwner APIレスポンスのパースに失敗しました",
          error,
          apiData,
        )
      }
      throw error
    }
  }

  /**
   * License API Response -> License
   */
  static parseLicense(apiData: unknown): License {
    try {
      const githubLicense = githubLicenseApiSchema.parse(apiData)

      const license: License = {
        key: githubLicense.key,
        name: githubLicense.name,
        spdxId: githubLicense.spdx_id,
        url: githubLicense.url,
      }

      return licenseSchema.parse(license)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub License APIレスポンスのパースに失敗しました",
          error,
          apiData,
        )
      }
      throw error
    }
  }

  /**
   * Pull Request API Response -> PullRequest
   */
  static parsePullRequest(apiData: unknown): PullRequest {
    try {
      const githubPr = githubPullRequestApiSchema.parse(apiData)

      const pullRequest: PullRequest = {
        id: githubPr.id,
        number: githubPr.number,
        title: githubPr.title,
        body: githubPr.body,
        state: githubPr.state,
        isDraft: githubPr.draft,
        isMerged: githubPr.merged,
        createdAt: githubPr.created_at,
        updatedAt: githubPr.updated_at,
        closedAt: githubPr.closed_at,
        mergedAt: githubPr.merged_at,
        htmlUrl: githubPr.html_url,
        head: this.parsePullRequestBranch(githubPr.head),
        base: this.parsePullRequestBranch(githubPr.base),
        user: this.parseRepositoryOwner(githubPr.user),
        assignees: githubPr.assignees.map((assignee) =>
          this.parseRepositoryOwner(assignee),
        ),
        reviewers: githubPr.requested_reviewers.map((reviewer) =>
          this.parseRepositoryOwner(reviewer),
        ),
        labels: githubPr.labels.map((label) => this.parseLabel(label)),
      }

      // ビジネスルール検証
      this.validatePullRequestBusinessRules(pullRequest)

      return pullRequestSchema.parse(pullRequest)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub PullRequest APIレスポンスのパースに失敗しました",
          error,
          apiData,
        )
      }
      throw error
    }
  }

  /**
   * Pull Request Branch API Response -> PullRequestBranch
   */
  static parsePullRequestBranch(apiData: unknown): PullRequestBranch {
    try {
      const githubBranch = githubPullRequestBranchApiSchema.parse(apiData)

      const branch: PullRequestBranch = {
        ref: githubBranch.ref,
        sha: githubBranch.sha,
        label: githubBranch.label,
        repo: githubBranch.repo
          ? this.parseRepository(githubBranch.repo)
          : null,
      }

      return pullRequestBranchSchema.parse(branch)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub PullRequestBranch APIレスポンスのパースに失敗しました",
          error,
          apiData,
        )
      }
      throw error
    }
  }

  /**
   * Issue API Response -> Issue
   */
  static parseIssue(apiData: unknown): Issue {
    try {
      const githubIssue = githubIssueApiSchema.parse(apiData)

      const issue: Issue = {
        id: githubIssue.id,
        number: githubIssue.number,
        title: githubIssue.title,
        body: githubIssue.body,
        state: githubIssue.state,
        createdAt: githubIssue.created_at,
        updatedAt: githubIssue.updated_at,
        closedAt: githubIssue.closed_at,
        htmlUrl: githubIssue.html_url,
        user: this.parseRepositoryOwner(githubIssue.user),
        assignees: githubIssue.assignees.map((assignee) =>
          this.parseRepositoryOwner(assignee),
        ),
        labels: githubIssue.labels.map((label) => this.parseLabel(label)),
        milestone: githubIssue.milestone
          ? this.parseMilestone(githubIssue.milestone)
          : null,
        comments: githubIssue.comments,
        isPullRequest: !!githubIssue.pull_request,
      }

      return issueSchema.parse(issue)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub Issue APIレスポンスのパースに失敗しました",
          error,
          apiData,
        )
      }
      throw error
    }
  }

  /**
   * Label API Response -> Label
   */
  static parseLabel(apiData: unknown): Label {
    try {
      const githubLabel = githubLabelApiSchema.parse(apiData)

      const label: Label = {
        id: githubLabel.id,
        name: githubLabel.name,
        description: githubLabel.description,
        color: githubLabel.color,
      }

      return labelSchema.parse(label)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub Label APIレスポンスのパースに失敗しました",
          error,
          apiData,
        )
      }
      throw error
    }
  }

  /**
   * Milestone API Response -> Milestone
   */
  static parseMilestone(apiData: unknown): Milestone {
    try {
      const githubMilestone = githubMilestoneApiSchema.parse(apiData)

      const milestone: Milestone = {
        id: githubMilestone.id,
        number: githubMilestone.number,
        title: githubMilestone.title,
        description: githubMilestone.description,
        state: githubMilestone.state,
        createdAt: githubMilestone.created_at,
        updatedAt: githubMilestone.updated_at,
        dueOn: githubMilestone.due_on,
        closedAt: githubMilestone.closed_at,
      }

      return milestoneSchema.parse(milestone)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub Milestone APIレスポンスのパースに失敗しました",
          error,
          apiData,
        )
      }
      throw error
    }
  }

  /**
   * Release API Response -> Release
   */
  static parseRelease(apiData: unknown): Release {
    try {
      const githubRelease = githubReleaseApiSchema.parse(apiData)

      const release: Release = {
        id: githubRelease.id,
        tagName: githubRelease.tag_name,
        name: githubRelease.name,
        body: githubRelease.body,
        isDraft: githubRelease.draft,
        isPrerelease: githubRelease.prerelease,
        createdAt: githubRelease.created_at,
        publishedAt: githubRelease.published_at,
        htmlUrl: githubRelease.html_url,
        tarballUrl: githubRelease.tarball_url,
        zipballUrl: githubRelease.zipball_url,
        author: this.parseRepositoryOwner(githubRelease.author),
        assets: githubRelease.assets.map((asset) =>
          this.parseReleaseAsset(asset),
        ),
      }

      return releaseSchema.parse(release)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub Release APIレスポンスのパースに失敗しました",
          error,
          apiData,
        )
      }
      throw error
    }
  }

  /**
   * Release Asset API Response -> ReleaseAsset
   */
  static parseReleaseAsset(apiData: unknown): ReleaseAsset {
    try {
      const githubAsset = githubReleaseAssetApiSchema.parse(apiData)

      const asset: ReleaseAsset = {
        id: githubAsset.id,
        name: githubAsset.name,
        label: githubAsset.label,
        contentType: githubAsset.content_type,
        size: githubAsset.size,
        downloadCount: githubAsset.download_count,
        createdAt: githubAsset.created_at,
        updatedAt: githubAsset.updated_at,
        browserDownloadUrl: githubAsset.browser_download_url,
      }

      return releaseAssetSchema.parse(asset)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new GitHubApiParseError(
          "GitHub ReleaseAsset APIレスポンスのパースに失敗しました",
          error,
          apiData,
        )
      }
      throw error
    }
  }

  /**
   * Pull Requestのビジネスルール検証
   * Parse, don't validate の原則に従い、パース時に業務ルールも検証
   */
  private static validatePullRequestBusinessRules(pr: PullRequest): void {
    const errors: string[] = []

    if (pr.isMerged && pr.state !== "closed") {
      errors.push("マージされたプルリクエストはclosed状態である必要があります")
    }

    if (pr.isMerged && !pr.mergedAt) {
      errors.push("マージされたプルリクエストにはmergedAtが必要です")
    }

    if (pr.isDraft && pr.isMerged) {
      errors.push("ドラフトプルリクエストはマージできません")
    }

    if (errors.length > 0) {
      throw new Error(`Pull Request業務ルール違反: ${errors.join(", ")}`)
    }
  }
}
