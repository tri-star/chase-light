/**
 * GitHub API Error Classes
 * GitHub API呼び出し時のエラーハンドリング用クラス
 */

/**
 * 基本のGitHub APIエラー
 */
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown,
  ) {
    super(message)
    this.name = "GitHubApiError"
  }
}

/**
 * GitHub API Rate Limit エラー
 */
export class GitHubRateLimitError extends GitHubApiError {
  constructor(
    message: string,
    public resetTime: Date,
    public remaining: number = 0,
  ) {
    super(message, 403)
    this.name = "GitHubRateLimitError"
  }
}

/**
 * GitHub認証エラー
 */
export class GitHubAuthenticationError extends GitHubApiError {
  constructor(message: string = "GitHub authentication failed") {
    super(message, 401)
    this.name = "GitHubAuthenticationError"
  }
}
