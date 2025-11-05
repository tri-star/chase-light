// GitHub repository URL utilities shared between frontend and backend.
// Supports canonical HTTPS GitHub repository URLs with optional trailing slash or .git suffix.

export type GitHubRepositoryUrlParts = {
  owner: string
  repo: string
}

const GITHUB_HOSTNAME = "github.com"

/**
 * Parses a GitHub repository URL and returns its owner/repo segments.
 * Returns null for non-GitHub URLs or invalid repository paths.
 */
export function parseGitHubRepositoryUrl(
  url: string,
): GitHubRepositoryUrlParts | null {
  if (!url) {
    return null
  }

  try {
    const parsedUrl = new globalThis.URL(url)

    if (parsedUrl.protocol !== "https:") {
      return null
    }

    if (parsedUrl.hostname.toLowerCase() !== GITHUB_HOSTNAME) {
      return null
    }

    // Disallow query strings or hash fragments to enforce canonical URLs.
    if (parsedUrl.search || parsedUrl.hash) {
      return null
    }

    const trimmedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, "")
    const [rawOwner, rawRepo, ...rest] = trimmedPath.split("/")

    if (!rawOwner || !rawRepo || rest.length > 0) {
      return null
    }

    const owner = decodeURIComponent(rawOwner)
    const repo = decodeURIComponent(rawRepo.replace(/\.git$/i, ""))

    if (!owner || !repo) {
      return null
    }

    return { owner, repo }
  } catch {
    return null
  }
}

/**
 * Determines whether the given URL is a valid GitHub repository URL.
 */
export function isGitHubRepositoryUrl(url: string): boolean {
  return parseGitHubRepositoryUrl(url) !== null
}
