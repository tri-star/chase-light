/**
 * GitHub API レスポンスの型定義
 */
export type GitHubRepositoryResponse = {
  id: number
  full_name: string
  name: string
  description: string | null
  html_url: string
  private: boolean
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  fork: boolean
}

/**
 * GitHub Release APIレスポンスの型定義
 */
export type GitHubReleaseResponse = {
  id: number
  tag_name: string
  name: string | null
  body: string | null
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string | null
  html_url: string
}

/**
 * GitHub Issue APIレスポンスの型定義
 */
export type GitHubIssueResponse = {
  id: number
  number: number
  title: string
  body: string | null
  state: "open" | "closed"
  created_at: string
  updated_at: string
  closed_at: string | null
  html_url: string
  user: {
    login: string
    avatar_url: string
  }
}

/**
 * GitHub Pull Request APIレスポンスの型定義
 */
export type GitHubPullRequestResponse = {
  id: number
  number: number
  title: string
  body: string | null
  state: "open" | "closed"
  created_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  html_url: string
  user: {
    login: string
    avatar_url: string
  }
}

export interface GitHubActivityGateway {
  /**
   * リポジトリのリリース一覧を取得
   */
  getReleases(
    owner: string,
    repo: string,
    options?: { perPage?: number; page?: number },
  ): Promise<GitHubReleaseResponse[]>

  /**
   * リポジトリのIssue一覧を取得
   */
  getIssues(
    owner: string,
    repo: string,
    options?: {
      state?: "open" | "closed" | "all"
      since?: string
      perPage?: number
      page?: number
    },
  ): Promise<GitHubIssueResponse[]>

  /**
   * リポジトリのPull Request一覧を取得
   */
  getPullRequests(
    owner: string,
    repo: string,
    options?: {
      state?: "open" | "closed" | "all"
      since?: string
      perPage?: number
      page?: number
    },
  ): Promise<GitHubPullRequestResponse[]>
}
