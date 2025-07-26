import { GitHubApiError } from "../errors"
import type {
  GitHubApiServiceInterface,
  GitHubRepositoryResponse,
  GitHubReleaseResponse,
  GitHubIssueResponse,
  GitHubPullRequestResponse,
} from "./interfaces/github-api-service.interface"

/**
 * GitHub API サービスのスタブ実装
 * E2Eテストで使用し、実際のGitHub APIを呼び出さずに制御可能なレスポンスを返す
 */
export class GitHubApiServiceStub implements GitHubApiServiceInterface {
  private stubResponse:
    | GitHubRepositoryResponse
    | { status: number; message: string }
    | ((owner: string, repo: string) => GitHubRepositoryResponse)
    | undefined
  private stubReleases:
    | GitHubReleaseResponse[]
    | { status: number; message: string }
    | ((owner: string, repo: string) => GitHubReleaseResponse[])
    | undefined
  private stubIssues:
    | GitHubIssueResponse[]
    | { status: number; message: string }
    | ((
        owner: string,
        repo: string,
        options?: {
          state?: "open" | "closed" | "all"
          since?: string
          perPage?: number
          page?: number
        },
      ) => GitHubIssueResponse[])
    | undefined
  private stubPullRequests:
    | GitHubPullRequestResponse[]
    | { status: number; message: string }
    | ((
        owner: string,
        repo: string,
        options?: {
          state?: "open" | "closed" | "all"
          since?: string
          perPage?: number
          page?: number
        },
      ) => GitHubPullRequestResponse[])
    | undefined

  /**
   * リポジトリ情報を取得（スタブ実装）
   */
  async getRepository(
    owner: string,
    repo: string,
  ): Promise<GitHubRepositoryResponse> {
    if (this.stubResponse) {
      if (
        typeof this.stubResponse === "object" &&
        "status" in this.stubResponse &&
        "message" in this.stubResponse
      ) {
        throw new GitHubApiError(
          this.stubResponse.message,
          this.stubResponse.status,
        )
      } else if (typeof this.stubResponse === "function") {
        return this.stubResponse(owner, repo)
      } else {
        return this.stubResponse
      }
    }
    return this.generateDefaultResponse(owner, repo)
  }

  /**
   * 特定のリポジトリに対するスタブレスポンスを設定
   */
  setStubResponse(
    response:
      | GitHubRepositoryResponse
      | { status: number; message: string }
      | ((owner: string, repo: string) => GitHubRepositoryResponse),
  ): void {
    this.stubResponse = response
  }

  /**
   * リポジトリのリリース一覧を取得（スタブ実装）
   */
  async getReleases(
    owner: string,
    repo: string,
    _options?: { perPage?: number; page?: number },
  ): Promise<GitHubReleaseResponse[]> {
    if (this.stubReleases) {
      if (
        typeof this.stubReleases === "object" &&
        "status" in this.stubReleases &&
        "message" in this.stubReleases
      ) {
        throw new GitHubApiError(
          this.stubReleases.message,
          this.stubReleases.status,
        )
      } else if (typeof this.stubReleases === "function") {
        return this.stubReleases(owner, repo)
      } else {
        return this.stubReleases
      }
    }
    return this.generateDefaultReleases(owner, repo)
  }

  /**
   * リポジトリのIssue一覧を取得（スタブ実装）
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
    if (this.stubIssues) {
      if (
        typeof this.stubIssues === "object" &&
        "status" in this.stubIssues &&
        "message" in this.stubIssues
      ) {
        throw new GitHubApiError(
          this.stubIssues.message,
          this.stubIssues.status,
        )
      }
      let issues: GitHubIssueResponse[] = []
      if (typeof this.stubIssues === "function") {
        issues = this.stubIssues(owner, repo, options)
      } else {
        issues = this.stubIssues
      }
      // sinceフィルタリング
      if (options?.since) {
        const sinceDate = new Date(options.since)
        issues = issues.filter(
          (issue) => new Date(issue.created_at) >= sinceDate,
        )
      }
      return issues
    }
    return this.generateDefaultIssues(owner, repo, options?.since)
  }

  /**
   * リポジトリのPull Request一覧を取得（スタブ実装）
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
    if (this.stubPullRequests) {
      if (
        typeof this.stubPullRequests === "object" &&
        "status" in this.stubPullRequests &&
        "message" in this.stubPullRequests
      ) {
        throw new GitHubApiError(
          this.stubPullRequests.message,
          this.stubPullRequests.status,
        )
      }
      let prs: GitHubPullRequestResponse[] = []
      if (typeof this.stubPullRequests === "function") {
        prs = this.stubPullRequests(owner, repo, options)
      } else {
        prs = this.stubPullRequests
      }
      // sinceフィルタリング
      if (options?.since) {
        const sinceDate = new Date(options.since)
        prs = prs.filter((pr) => new Date(pr.created_at) >= sinceDate)
      }
      return prs
    }
    return this.generateDefaultPullRequests(owner, repo, options?.since)
  }

  /**
   * 特定のリポジトリに対するリリーススタブを設定
   */
  setStubReleases(
    releases:
      | GitHubReleaseResponse[]
      | { status: number; message: string }
      | ((owner: string, repo: string) => GitHubReleaseResponse[]),
  ): void {
    this.stubReleases = releases
  }

  /**
   * 特定のリポジトリに対するIssueスタブを設定
   */
  setStubIssues(
    issues:
      | GitHubIssueResponse[]
      | { status: number; message: string }
      | ((
          owner: string,
          repo: string,
          options?: {
            state?: "open" | "closed" | "all"
            since?: string
            perPage?: number
            page?: number
          },
        ) => GitHubIssueResponse[]),
  ): void {
    this.stubIssues = issues
  }

  /**
   * 特定のリポジトリに対するPull Requestスタブを設定
   */
  setStubPullRequests(
    prs:
      | GitHubPullRequestResponse[]
      | { status: number; message: string }
      | ((
          owner: string,
          repo: string,
          options?: {
            state?: "open" | "closed" | "all"
            since?: string
            perPage?: number
            page?: number
          },
        ) => GitHubPullRequestResponse[]),
  ): void {
    this.stubPullRequests = prs
  }

  /**
   * 全てのスタブ設定をリセット
   */
  resetStubs(): void {
    this.stubResponse = undefined
    this.stubReleases = undefined
    this.stubIssues = undefined
    this.stubPullRequests = undefined
  }

  /**
   * デフォルトのレスポンスを生成
   * owner/repoに基づいて一貫したレスポンスを生成する
   */
  private generateDefaultResponse(
    owner: string,
    repo: string,
  ): GitHubRepositoryResponse {
    const consistentId = this.generateConsistentId(owner, repo)

    return {
      id: consistentId,
      full_name: `${owner}/${repo}`,
      name: repo,
      description: `Mock description for ${repo}`,
      html_url: `https://github.com/${owner}/${repo}`,
      private: false,
      language: this.detectLanguage(repo),
      stargazers_count: Math.floor((consistentId % 10000) + 1000), // 1000-10999の範囲
      forks_count: Math.floor((consistentId % 1000) + 100), // 100-1099の範囲
      open_issues_count: Math.floor((consistentId % 100) + 10), // 10-109の範囲
      fork: false,
    }
  }

  /**
   * owner/repoの組み合わせから一貫したIDを生成
   */
  private generateConsistentId(owner: string, repo: string): number {
    const combined = `${owner}/${repo}`
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 32bit整数に変換
    }
    // 正の数にして、現実的なGitHub IDの範囲にする
    return (Math.abs(hash) % 100000000) + 1000000 // 1000000-100999999の範囲
  }

  /**
   * リポジトリ名から推測される言語を返す
   */
  private detectLanguage(repo: string): string | null {
    const lowerRepo = repo.toLowerCase()

    if (lowerRepo.includes("react") || lowerRepo.includes("next")) {
      return "JavaScript"
    }
    if (lowerRepo.includes("typescript") || lowerRepo.includes("ts")) {
      return "TypeScript"
    }
    if (lowerRepo.includes("python") || lowerRepo.includes("py")) {
      return "Python"
    }
    if (lowerRepo.includes("java")) {
      return "Java"
    }
    if (lowerRepo.includes("go") || lowerRepo.includes("golang")) {
      return "Go"
    }
    if (lowerRepo.includes("rust")) {
      return "Rust"
    }

    // デフォルト
    return "JavaScript"
  }

  /**
   * デフォルトのリリース一覧を生成
   */
  private generateDefaultReleases(
    owner: string,
    repo: string,
  ): GitHubReleaseResponse[] {
    const baseId = this.generateConsistentId(owner, repo)
    const now = new Date()

    return [
      {
        id: baseId + 1,
        tag_name: "v1.0.0",
        name: "Version 1.0.0",
        body: "Initial release with basic features",
        draft: false,
        prerelease: false,
        created_at: new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        published_at: new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        html_url: `https://github.com/${owner}/${repo}/releases/tag/v1.0.0`,
      },
      {
        id: baseId + 2,
        tag_name: "v1.1.0",
        name: "Version 1.1.0",
        body: "Bug fixes and performance improvements",
        draft: false,
        prerelease: false,
        created_at: new Date(
          now.getTime() - 10 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        published_at: new Date(
          now.getTime() - 10 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        html_url: `https://github.com/${owner}/${repo}/releases/tag/v1.1.0`,
      },
    ]
  }

  /**
   * デフォルトのIssue一覧を生成
   */
  private generateDefaultIssues(
    owner: string,
    repo: string,
    since?: string,
  ): GitHubIssueResponse[] {
    const baseId = this.generateConsistentId(owner, repo)
    const now = new Date()
    const sinceDate = since ? new Date(since) : new Date(0)

    const issues: GitHubIssueResponse[] = [
      {
        id: baseId + 100,
        number: 1,
        title: "Bug: Application crashes on startup",
        body: "The application crashes when trying to start with certain configurations",
        state: "open",
        created_at: new Date(
          now.getTime() - 5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: new Date(
          now.getTime() - 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        closed_at: null,
        html_url: `https://github.com/${owner}/${repo}/issues/1`,
        user: {
          login: "testuser1",
          avatar_url: "https://github.com/testuser1.png",
        },
      },
      {
        id: baseId + 101,
        number: 2,
        title: "Feature request: Add dark mode",
        body: "It would be great to have a dark mode option",
        state: "closed",
        created_at: new Date(
          now.getTime() - 20 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: new Date(
          now.getTime() - 15 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        closed_at: new Date(
          now.getTime() - 15 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        html_url: `https://github.com/${owner}/${repo}/issues/2`,
        user: {
          login: "testuser2",
          avatar_url: "https://github.com/testuser2.png",
        },
      },
    ]

    return issues.filter((issue) => new Date(issue.created_at) >= sinceDate)
  }

  /**
   * デフォルトのPull Request一覧を生成
   */
  private generateDefaultPullRequests(
    owner: string,
    repo: string,
    since?: string,
  ): GitHubPullRequestResponse[] {
    const baseId = this.generateConsistentId(owner, repo)
    const now = new Date()
    const sinceDate = since ? new Date(since) : new Date(0)

    const prs: GitHubPullRequestResponse[] = [
      {
        id: baseId + 200,
        number: 10,
        title: "Fix: Memory leak in data processing",
        body: "This PR fixes the memory leak issue found in the data processing module",
        state: "open",
        created_at: new Date(
          now.getTime() - 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: new Date(
          now.getTime() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        closed_at: null,
        merged_at: null,
        html_url: `https://github.com/${owner}/${repo}/pull/10`,
        user: {
          login: "contributor1",
          avatar_url: "https://github.com/contributor1.png",
        },
      },
      {
        id: baseId + 201,
        number: 11,
        title: "Add unit tests for authentication module",
        body: "Adding comprehensive unit tests for the authentication module",
        state: "closed",
        created_at: new Date(
          now.getTime() - 12 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: new Date(
          now.getTime() - 8 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        closed_at: new Date(
          now.getTime() - 8 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        merged_at: new Date(
          now.getTime() - 8 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        html_url: `https://github.com/${owner}/${repo}/pull/11`,
        user: {
          login: "contributor2",
          avatar_url: "https://github.com/contributor2.png",
        },
      },
    ]

    return prs.filter((pr) => new Date(pr.created_at) >= sinceDate)
  }
}
