import { GitHubActivityGateway as GitHubActivityGatewayInterface } from "../../../application/ports/github-activity.gateway"
import { StubGitHubActivityGateway } from "./stub-github-activity.gateway"
import { GitHubActivityGateway } from "./github-activity.gateway"

let stubInstance: GitHubActivityGatewayInterface | null = null

/**
 * GitHub API サービスのファクトリ関数
 * 環境変数 USE_GITHUB_API_STUB に基づいてサービス実装を切り替える
 */
export function createGitHubActivityGateway(
  accessToken?: string,
): GitHubActivityGatewayInterface {
  const useStub = process.env.USE_GITHUB_API_STUB === "true"

  if (useStub) {
    if (!stubInstance) {
      stubInstance = new StubGitHubActivityGateway()
    }
    return stubInstance
  }

  return new GitHubActivityGateway(accessToken)
}
