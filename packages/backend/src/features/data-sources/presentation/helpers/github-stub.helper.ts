// @playwright/testはE2Eテスト実行時のみ利用可能
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Page = any
import type { GitHubRepositoryResponse } from "../../services/interfaces/github-api-service.interface"

/**
 * Playwright用GitHubスタブヘルパー
 * E2Eテストでのスタブ制御を簡易化
 */
export class GitHubStubHelper {
  constructor(
    private page: Page,
    private baseUrl: string = "http://localhost:3000",
  ) {}

  /**
   * 特定のリポジトリにスタブレスポンスを設定
   */
  async setStubResponse(
    key: string,
    response: GitHubRepositoryResponse,
  ): Promise<void> {
    const result = await this.page.request.post(
      `${this.baseUrl}/e2e-control/github/stub-response`,
      {
        data: {
          key,
          response,
        },
      },
    )

    if (!result.ok()) {
      const errorText = await result.text()
      throw new Error(`Failed to set stub response: ${errorText}`)
    }
  }

  /**
   * 特定のリポジトリにエラーシナリオを設定
   */
  async setErrorScenario(
    key: string,
    error: { status: number; message: string },
  ): Promise<void> {
    const result = await this.page.request.post(
      `${this.baseUrl}/e2e-control/github/error-scenario`,
      {
        data: {
          key,
          error,
        },
      },
    )

    if (!result.ok()) {
      const errorText = await result.text()
      throw new Error(`Failed to set error scenario: ${errorText}`)
    }
  }

  /**
   * すべてのスタブ設定をリセット
   */
  async resetStubs(): Promise<void> {
    const result = await this.page.request.post(
      `${this.baseUrl}/e2e-control/github/reset`,
    )

    if (!result.ok()) {
      const errorText = await result.text()
      throw new Error(`Failed to reset stubs: ${errorText}`)
    }
  }

  /**
   * テスト用のリポジトリレスポンスを生成
   */
  createTestRepository(params: {
    owner: string
    repo: string
    id?: number
    language?: string
    private?: boolean
    stars?: number
    forks?: number
    issues?: number
  }): GitHubRepositoryResponse {
    return {
      id: params.id ?? Math.floor(Math.random() * 1000000) + 1000000,
      full_name: `${params.owner}/${params.repo}`,
      name: params.repo,
      description: `Test repository for ${params.repo}`,
      html_url: `https://github.com/${params.owner}/${params.repo}`,
      private: params.private ?? false,
      language: params.language ?? "JavaScript",
      stargazers_count: params.stars ?? 1000,
      forks_count: params.forks ?? 100,
      open_issues_count: params.issues ?? 10,
      fork: false,
    }
  }

  /**
   * 複数のリポジトリのスタブを一括設定
   */
  async setupMultipleRepositories(
    repositories: Array<{
      owner: string
      repo: string
      response?: {
        id?: number
        language?: string
        private?: boolean
        stars?: number
        forks?: number
        issues?: number
      }
      error?: { status: number; message: string }
    }>,
  ): Promise<void> {
    for (const repo of repositories) {
      const key = `${repo.owner}/${repo.repo}`

      if (repo.error) {
        await this.setErrorScenario(key, repo.error)
      } else {
        const response = this.createTestRepository({
          owner: repo.owner,
          repo: repo.repo,
          ...(repo.response || {}),
        })
        await this.setStubResponse(key, response)
      }
    }
  }

  /**
   * よく使用されるエラーシナリオの定数
   */
  static readonly ERROR_SCENARIOS = {
    REPOSITORY_NOT_FOUND: { status: 404, message: "Repository not found" },
    RATE_LIMIT_EXCEEDED: {
      status: 403,
      message: "GitHub API rate limit exceeded",
    },
    FORBIDDEN: { status: 403, message: "Repository access forbidden" },
    INTERNAL_ERROR: { status: 500, message: "GitHub API internal error" },
  } as const
}
