/**
 * 無効なリポジトリURLの場合のエラー
 */
export class InvalidRepositoryUrlError extends Error {
  constructor(url?: string) {
    super(
      url
        ? `Invalid GitHub repository URL format: ${url}`
        : "Invalid GitHub repository URL format",
    )
    this.name = "InvalidRepositoryUrlError"
  }
}
