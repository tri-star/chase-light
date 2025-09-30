import type {
  GitHubRepositoryDto,
  GitHubRepositoryPort,
} from "../../../application/ports"
import { GitHubApiError } from "../../../errors"

export type LegacyGitHubRepositoryResponse = {
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

export type GitHubRepositoryStubResponse =
  | GitHubRepositoryDto
  | LegacyGitHubRepositoryResponse
  | { status: number; message: string }
  | ((owner: string, repo: string) => GitHubRepositoryDto)

export class GitHubRepositoryStub implements GitHubRepositoryPort {
  private stubResponse: GitHubRepositoryStubResponse | undefined

  async getRepository(
    owner: string,
    repo: string,
  ): Promise<GitHubRepositoryDto> {
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
      }
      if (typeof this.stubResponse === "function") {
        return this.stubResponse(owner, repo)
      }
      if (this.isLegacyResponse(this.stubResponse)) {
        return this.convertLegacyResponse(this.stubResponse)
      }
      return this.stubResponse
    }

    return this.generateDefaultResponse(owner, repo)
  }

  setStubResponse(response: GitHubRepositoryStubResponse): void {
    if (this.isLegacyResponse(response)) {
      this.stubResponse = this.convertLegacyResponse(response)
      return
    }
    this.stubResponse = response
  }

  resetStubs(): void {
    this.stubResponse = undefined
  }

  private generateDefaultResponse(
    owner: string,
    repo: string,
  ): GitHubRepositoryDto {
    const consistentId = this.generateConsistentId(owner, repo)

    return {
      id: consistentId,
      fullName: `${owner}/${repo}`,
      name: repo,
      description: `Mock description for ${repo}`,
      htmlUrl: `https://github.com/${owner}/${repo}`,
      private: false,
      language: this.detectLanguage(repo),
      stargazersCount: Math.floor((consistentId % 10000) + 1000),
      forksCount: Math.floor((consistentId % 1000) + 100),
      openIssuesCount: Math.floor((consistentId % 100) + 10),
      fork: false,
    }
  }

  private convertLegacyResponse(
    response: LegacyGitHubRepositoryResponse,
  ): GitHubRepositoryDto {
    return {
      id: response.id,
      fullName: response.full_name,
      name: response.name,
      description: response.description,
      htmlUrl: response.html_url,
      private: response.private,
      language: response.language,
      stargazersCount: response.stargazers_count,
      forksCount: response.forks_count,
      openIssuesCount: response.open_issues_count,
      fork: response.fork,
    }
  }

  private isLegacyResponse(
    response: GitHubRepositoryStubResponse,
  ): response is LegacyGitHubRepositoryResponse {
    return (
      typeof response === "object" &&
      response !== null &&
      "full_name" in response &&
      "html_url" in response
    )
  }

  private generateConsistentId(owner: string, repo: string): number {
    const combined = `${owner}/${repo}`
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash &= hash
    }
    return (Math.abs(hash) % 100000000) + 1000000
  }

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

    return "JavaScript"
  }
}
