import { Octokit } from "@octokit/rest"
import type {
  GitHubRepositoryDto,
  GitHubRepositoryPort,
} from "../../../application/ports"
import { GitHubApiError } from "../../../errors"

export class GitHubRepositoryAdapter implements GitHubRepositoryPort {
  private readonly octokit: Octokit

  constructor(accessToken?: string) {
    this.octokit = new Octokit({ auth: accessToken })
  }

  async getRepository(
    owner: string,
    repo: string,
  ): Promise<GitHubRepositoryDto> {
    try {
      const response = await this.octokit.rest.repos.get({ owner, repo })
      return this.mapRepository(response.data)
    } catch (error: unknown) {
      this.handleApiError(error, `${owner}/${repo}`)
    }
  }

  private mapRepository(data: Record<string, unknown>): GitHubRepositoryDto {
    return {
      id: Number(data.id),
      fullName: String(data.full_name),
      name: String(data.name),
      description:
        data.description === null || data.description === undefined
          ? null
          : String(data.description),
      htmlUrl: String(data.html_url),
      private: Boolean(data.private),
      language:
        data.language === null || data.language === undefined
          ? null
          : String(data.language),
      stargazersCount: Number(data.stargazers_count ?? 0),
      forksCount: Number(data.forks_count ?? 0),
      openIssuesCount: Number(data.open_issues_count ?? 0),
      fork: Boolean(data.fork),
    }
  }

  private handleApiError(error: unknown, resource: string): never {
    if (this.isOctokitError(error)) {
      if (error.status === 404) {
        throw new GitHubApiError(`${resource} not found or not accessible`, 404)
      }
      if (error.status === 403) {
        throw new GitHubApiError(
          "GitHub API rate limit exceeded or forbidden",
          403,
        )
      }
      throw new GitHubApiError(
        `GitHub API error: ${error.message}`,
        error.status,
      )
    }

    const fallbackError = error as { message?: string }
    throw new GitHubApiError(
      `GitHub API error: ${fallbackError.message || "Unknown error"}`,
      undefined,
    )
  }

  private isOctokitError(
    error: unknown,
  ): error is { status: number; message: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      "message" in error &&
      typeof (error as Record<string, unknown>).status === "number" &&
      typeof (error as Record<string, unknown>).message === "string"
    )
  }
}
