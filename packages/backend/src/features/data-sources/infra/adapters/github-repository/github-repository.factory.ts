import type { GitHubRepositoryPort } from "../../../application/ports"
import { GitHubRepositoryAdapter } from "./github-repository.adapter"
import {
  GitHubRepositoryStub,
  type GitHubRepositoryStubResponse,
} from "./github-repository.stub"

let stubInstance: GitHubRepositoryStub | null = null

export function createGitHubRepositoryPort(
  accessToken?: string,
): GitHubRepositoryPort {
  if (process.env.USE_GITHUB_API_STUB === "true") {
    if (!stubInstance) {
      stubInstance = new GitHubRepositoryStub()
    }
    return stubInstance
  }

  return new GitHubRepositoryAdapter(accessToken)
}

export function getGitHubRepositoryStub(): GitHubRepositoryStub | null {
  return stubInstance
}

export { GitHubRepositoryStubResponse }
