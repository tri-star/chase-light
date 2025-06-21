/**
 * GitHub API Integration Types
 *
 * GitHub APIから取得するデータの型定義
 */

/**
 * GitHubリポジトリ情報
 */
export interface Repository {
  id: number
  name: string
  fullName: string
  description: string | null
  htmlUrl: string
  cloneUrl: string
  stargazersCount: number
  watchersCount: number
  forksCount: number
  language: string | null
  topics: string[]
  isPrivate: boolean
  isFork: boolean
  isArchived: boolean
  defaultBranch: string
  createdAt: string
  updatedAt: string
  pushedAt: string | null
  owner: RepositoryOwner
  license: License | null
}

/**
 * リポジトリオーナー情報
 */
export interface RepositoryOwner {
  login: string
  id: number
  avatarUrl: string
  htmlUrl: string
  type: "User" | "Organization"
}

/**
 * ライセンス情報
 */
export interface License {
  key: string
  name: string
  spdxId: string | null
  url: string | null
}

/**
 * リリース情報
 */
export interface Release {
  id: number
  tagName: string
  name: string | null
  body: string | null
  isDraft: boolean
  isPrerelease: boolean
  createdAt: string
  publishedAt: string | null
  htmlUrl: string
  tarballUrl: string | null
  zipballUrl: string | null
  author: RepositoryOwner
  assets: ReleaseAsset[]
}

/**
 * リリースアセット情報
 */
export interface ReleaseAsset {
  id: number
  name: string
  label: string | null
  contentType: string
  size: number
  downloadCount: number
  createdAt: string
  updatedAt: string
  browserDownloadUrl: string
}

/**
 * Pull Request情報
 */
export interface PullRequest {
  id: number
  number: number
  title: string
  body: string | null
  state: "open" | "closed"
  isDraft: boolean
  isMerged: boolean
  createdAt: string
  updatedAt: string
  closedAt: string | null
  mergedAt: string | null
  htmlUrl: string
  head: PullRequestBranch
  base: PullRequestBranch
  user: RepositoryOwner
  assignees: RepositoryOwner[]
  reviewers: RepositoryOwner[]
  labels: Label[]
}

/**
 * Pull Requestのブランチ情報
 */
export interface PullRequestBranch {
  ref: string
  sha: string
  label: string
  repo: Repository | null
}

/**
 * Issue情報
 */
export interface Issue {
  id: number
  number: number
  title: string
  body: string | null
  state: "open" | "closed"
  createdAt: string
  updatedAt: string
  closedAt: string | null
  htmlUrl: string
  user: RepositoryOwner
  assignees: RepositoryOwner[]
  labels: Label[]
  milestone: Milestone | null
  comments: number
  isPullRequest: boolean
}

/**
 * ラベル情報
 */
export interface Label {
  id: number
  name: string
  description: string | null
  color: string
}

/**
 * マイルストーン情報
 */
export interface Milestone {
  id: number
  number: number
  title: string
  description: string | null
  state: "open" | "closed"
  createdAt: string
  updatedAt: string
  dueOn: string | null
  closedAt: string | null
}

/**
 * API Request Options
 */
export interface GitHubApiOptions {
  page?: number
  perPage?: number
}

export interface GitHubPullRequestOptions extends GitHubApiOptions {
  state?: "open" | "closed" | "all"
  sort?: "created" | "updated" | "popularity" | "long-running"
  direction?: "asc" | "desc"
}

export interface GitHubIssueOptions extends GitHubApiOptions {
  state?: "open" | "closed" | "all"
  sort?: "created" | "updated" | "comments"
  direction?: "asc" | "desc"
  since?: string // ISO 8601 date string
}

/**
 * Error Types
 */
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown,
  ) {
    super(message)
    this.name = "GitHubApiError"
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  constructor(
    message: string,
    public resetTime: Date,
    public remaining: number = 0,
  ) {
    super(message, 403)
    this.name = "GitHubRateLimitError"
  }
}

export class GitHubAuthenticationError extends GitHubApiError {
  constructor(message: string = "GitHub authentication failed") {
    super(message, 401)
    this.name = "GitHubAuthenticationError"
  }
}
