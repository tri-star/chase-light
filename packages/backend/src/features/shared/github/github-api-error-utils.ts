import { GitHubApiError } from "./github-api-error"

export function handleApiError(error: unknown, resource: string): never {
  if (isOctokitError(error)) {
    if (error.status === 404) {
      throw new GitHubApiError(`${resource} not found or not accessible`, 404)
    }
    if (error.status === 403) {
      throw new GitHubApiError(
        "GitHub API rate limit exceeded or forbidden",
        403,
      )
    }
    throw new GitHubApiError(`GitHub API error: ${error.message}`, error.status)
  }

  const fallbackError = error as { message?: string }
  throw new GitHubApiError(
    `GitHub API error: ${fallbackError.message || "Unknown error"}`,
    undefined,
  )
}

/**
 * Octokitエラーの型ガード
 */
export function isOctokitError(
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
