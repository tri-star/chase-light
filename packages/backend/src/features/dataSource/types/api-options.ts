/**
 * GitHub API Request Options
 * GitHub API呼び出し時のパラメータオプション
 */

/**
 * 共通のAPI Request Options
 */
export interface GitHubApiOptions {
  page?: number
  perPage?: number
}

/**
 * Pull Request API Options
 */
export interface GitHubPullRequestOptions extends GitHubApiOptions {
  state?: "open" | "closed" | "all"
  sort?: "created" | "updated" | "popularity" | "long-running"
  direction?: "asc" | "desc"
}

/**
 * Issue API Options
 */
export interface GitHubIssueOptions extends GitHubApiOptions {
  state?: "open" | "closed" | "all"
  sort?: "created" | "updated" | "comments"
  direction?: "asc" | "desc"
  since?: string // ISO 8601 date string
}
