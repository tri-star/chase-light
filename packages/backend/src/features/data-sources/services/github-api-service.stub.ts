import { GitHubApiError } from "../errors"
import type {
  GitHubApiServiceInterface,
  GitHubRepositoryResponse,
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
   * 全てのスタブ設定をリセット
   */
  resetStubs(): void {
    this.stubResponse = undefined
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
}
