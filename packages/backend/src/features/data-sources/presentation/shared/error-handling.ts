import type { Context } from "hono"
import { DuplicateDataSourceError, GitHubApiError, UserNotFoundError, DataSourceNotFoundError } from "../../errors"

/**
 * データソースエラーコード定義
 */
export const DATA_SOURCE_ERROR_CODES = {
  INVALID_REPOSITORY_URL: "INVALID_REPOSITORY_URL",
  REPOSITORY_NOT_FOUND: "REPOSITORY_NOT_FOUND",
  REPOSITORY_ACCESS_DENIED: "REPOSITORY_ACCESS_DENIED",
  DUPLICATE_REPOSITORY: "DUPLICATE_REPOSITORY",
  GITHUB_API_ERROR: "GITHUB_API_ERROR",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  DATA_SOURCE_NOT_FOUND: "DATA_SOURCE_NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const

export type DataSourceErrorCode =
  (typeof DATA_SOURCE_ERROR_CODES)[keyof typeof DATA_SOURCE_ERROR_CODES]

/**
 * エラー詳細情報の型定義
 */
export type ErrorDetails = {
  field?: string
  value?: string
}

/**
 * データソースカスタムエラークラス
 */
export class DataSourceError extends Error {
  public readonly code: DataSourceErrorCode
  public readonly httpStatus: number
  public readonly details?: ErrorDetails

  constructor(params: {
    code: DataSourceErrorCode
    message: string
    httpStatus: number
    details?: ErrorDetails
  }) {
    super(params.message)
    this.name = "DataSourceError"
    this.code = params.code
    this.httpStatus = params.httpStatus
    this.details = params.details
  }

  static invalidRepositoryUrl(url?: string): DataSourceError {
    return new DataSourceError({
      code: DATA_SOURCE_ERROR_CODES.INVALID_REPOSITORY_URL,
      message: "無効なGitHubリポジトリURLです",
      httpStatus: 400,
      details: { field: "repositoryUrl", value: url },
    })
  }

  static repositoryNotFound(repositoryName?: string): DataSourceError {
    return new DataSourceError({
      code: DATA_SOURCE_ERROR_CODES.REPOSITORY_NOT_FOUND,
      message: "指定されたリポジトリが見つからないか、アクセスできません",
      httpStatus: 404,
      details: { field: "repositoryUrl", value: repositoryName },
    })
  }

  static duplicateRepository(repositoryName?: string): DataSourceError {
    return new DataSourceError({
      code: DATA_SOURCE_ERROR_CODES.DUPLICATE_REPOSITORY,
      message: "このリポジトリは既に登録されています",
      httpStatus: 409,
      details: { field: "repositoryUrl", value: repositoryName },
    })
  }

  static githubApiError(message: string): DataSourceError {
    return new DataSourceError({
      code: DATA_SOURCE_ERROR_CODES.GITHUB_API_ERROR,
      message: `GitHub APIエラー: ${message}`,
      httpStatus: 500,
    })
  }

  static userNotFound(): DataSourceError {
    return new DataSourceError({
      code: DATA_SOURCE_ERROR_CODES.USER_NOT_FOUND,
      message: "ユーザーが見つかりません",
      httpStatus: 401,
    })
  }

  static dataSourceNotFound(): DataSourceError {
    return new DataSourceError({
      code: DATA_SOURCE_ERROR_CODES.DATA_SOURCE_NOT_FOUND,
      message: "データソースが見つかりません、またはアクセス権限がありません",
      httpStatus: 404,
    })
  }

  static internalError(message?: string): DataSourceError {
    return new DataSourceError({
      code: DATA_SOURCE_ERROR_CODES.INTERNAL_ERROR,
      message: message || "内部サーバーエラーが発生しました",
      httpStatus: 500,
    })
  }
}

/**
 * データソース操作のエラーハンドリング
 */
export function handleDataSourceError(
  c: Context,
  error: unknown,
  operation: string,
) {
  console.error(`Data source ${operation} error:`, error)

  // 既知のカスタムエラー
  if (error instanceof DataSourceError) {
    return c.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      error.httpStatus as 400 | 401 | 404 | 409 | 500,
    )
  }

  // サービス層のエラー
  if (error instanceof DuplicateDataSourceError) {
    const dataSourceError = DataSourceError.duplicateRepository()
    return c.json(
      {
        success: false,
        error: {
          code: dataSourceError.code,
          message: dataSourceError.message,
          details: dataSourceError.details,
        },
      },
      dataSourceError.httpStatus as 409,
    )
  }

  if (error instanceof GitHubApiError) {
    if (error.status === 404) {
      const dataSourceError = DataSourceError.repositoryNotFound()
      return c.json(
        {
          success: false,
          error: {
            code: dataSourceError.code,
            message: dataSourceError.message,
            details: dataSourceError.details,
          },
        },
        dataSourceError.httpStatus as 404,
      )
    }

    const dataSourceError = DataSourceError.githubApiError(error.message)
    return c.json(
      {
        success: false,
        error: {
          code: dataSourceError.code,
          message: dataSourceError.message,
        },
      },
      dataSourceError.httpStatus as 500,
    )
  }

  // ユーザー関連エラー
  if (error instanceof UserNotFoundError) {
    const dataSourceError = DataSourceError.userNotFound()
    return c.json(
      {
        success: false,
        error: {
          code: dataSourceError.code,
          message: dataSourceError.message,
        },
      },
      dataSourceError.httpStatus as 401,
    )
  }

  // データソース詳細関連エラー
  if (error instanceof DataSourceNotFoundError) {
    const dataSourceError = DataSourceError.dataSourceNotFound()
    return c.json(
      {
        success: false,
        error: {
          code: dataSourceError.code,
          message: dataSourceError.message,
        },
      },
      dataSourceError.httpStatus as 404,
    )
  }

  // 不明なエラー
  if (
    error instanceof Error &&
    error.message.includes("Invalid GitHub repository URL")
  ) {
    const dataSourceError = DataSourceError.invalidRepositoryUrl()
    return c.json(
      {
        success: false,
        error: {
          code: dataSourceError.code,
          message: dataSourceError.message,
          details: dataSourceError.details,
        },
      },
      dataSourceError.httpStatus as 400,
    )
  }

  // その他のエラー
  const dataSourceError = DataSourceError.internalError()
  return c.json(
    {
      success: false,
      error: {
        code: dataSourceError.code,
        message: dataSourceError.message,
      },
    },
    dataSourceError.httpStatus as 500,
  )
}
