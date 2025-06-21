import type { ZodError } from "zod/v4"

/**
 * GitHub API Parse Error
 * GitHub API レスポンスのパース中に発生したエラーを表すクラス
 */
export class GitHubApiParseError extends Error {
  public readonly name = "GitHubApiParseError"
  public readonly zodError: ZodError
  public readonly rawData: unknown

  constructor(message: string, zodError: ZodError, rawData: unknown) {
    super(message)
    this.zodError = zodError
    this.rawData = rawData

    // Error スタックトレースを正しく設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GitHubApiParseError)
    }
  }

  /**
   * Zodのバリデーションエラーを読みやすい形式に変換
   */
  getFormattedErrors(): string[] {
    return this.zodError.issues.map((issue) => {
      const path =
        issue.path.length > 0 ? ` (path: ${issue.path.join(".")})` : ""
      return `${issue.message}${path}`
    })
  }

  /**
   * JSON形式でのエラー情報
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      formattedErrors: this.getFormattedErrors(),
      zodError: {
        issues: this.zodError.issues,
      },
      rawData: this.rawData,
    }
  }
}
