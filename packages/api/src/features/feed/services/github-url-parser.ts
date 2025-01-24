type ParsedGitHubUrl = {
  owner: string
  repo: string
}

export class GitHubUrlParser {
  parse(url: string): ParsedGitHubUrl {
    const urlObject = new URL(url)

    if (urlObject.protocol !== 'https:') {
      throw new GitHubUrlParseError(url)
    }

    if (urlObject.hostname !== 'github.com') {
      throw new GitHubUrlParseError(url)
    }
    const pathParts = urlObject.pathname.split('/')
    const owner = decodeURIComponent(pathParts[1]).trim()
    const repo = decodeURIComponent(pathParts[2]).trim()

    if (!owner || !repo) {
      throw new GitHubUrlParseError(url)
    }

    return { owner, repo }
  }

  isValidRepoUrl(url: string) {
    try {
      this.parse(url)
      return true
    } catch {
      return false
    }
  }
}

export class GitHubUrlParseError extends Error {
  public url: string
  constructor(url: string) {
    super(`無効なGitHub URLです: ${url}`)
    this.url = url
  }
}
