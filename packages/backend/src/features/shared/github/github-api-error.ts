/**
 * GitHub API エラーの型定義
 */
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = "GitHubApiError"
  }
}
