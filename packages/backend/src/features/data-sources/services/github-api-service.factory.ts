import { GitHubApiService } from "./github-api.service"
import { GitHubApiServiceStub } from "./github-api-service.stub"
import type { GitHubApiServiceInterface } from "./interfaces/github-api-service.interface"

let stubInstance: GitHubApiServiceStub | null = null

/**
 * GitHub API サービスのファクトリ関数
 * 環境変数 USE_GITHUB_API_STUB に基づいてサービス実装を切り替える
 */
export function createGitHubApiService(
  accessToken?: string,
): GitHubApiServiceInterface {
  const useStub = process.env.USE_GITHUB_API_STUB === "true"

  if (useStub) {
    if (!stubInstance) {
      stubInstance = new GitHubApiServiceStub()
    }
    return stubInstance
  }

  return new GitHubApiService(accessToken)
}
