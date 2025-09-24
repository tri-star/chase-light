/**
 * User Error Types
 *
 * ユーザー機能における各種エラーを表現する型定義
 */

/**
 * UserErrorで使用されるHTTPステータスコードの型定義
 */
export type UserErrorHttpStatus = 400 | 401 | 404 | 409 | 500

export enum UserErrorCode {
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  GITHUB_USERNAME_ALREADY_EXISTS = "GITHUB_USERNAME_ALREADY_EXISTS",
  INVALID_TIMEZONE = "INVALID_TIMEZONE",
  UNSUPPORTED_LANGUAGE = "UNSUPPORTED_LANGUAGE",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PROFILE_UPDATE_FAILED = "PROFILE_UPDATE_FAILED",
  SETTINGS_UPDATE_FAILED = "SETTINGS_UPDATE_FAILED",
}

export interface UserErrorDetails {
  code: UserErrorCode
  message: string
  httpStatus: UserErrorHttpStatus
  details?: {
    field?: string
    value?: string
    expected?: string
    actual?: string
  }
}

export class UserError extends Error {
  public readonly code: UserErrorCode
  public readonly httpStatus: UserErrorHttpStatus
  public readonly details?: UserErrorDetails["details"]

  constructor(errorDetails: UserErrorDetails) {
    super(errorDetails.message)
    this.name = "UserError"
    this.code = errorDetails.code
    this.httpStatus = errorDetails.httpStatus
    this.details = errorDetails.details
  }

  static emailAlreadyExists(email?: string): UserError {
    return new UserError({
      code: UserErrorCode.EMAIL_ALREADY_EXISTS,
      message: "このメールアドレスは既に使用されています",
      httpStatus: 409,
      details: { field: "email", value: email },
    })
  }

  static githubUsernameAlreadyExists(username?: string): UserError {
    return new UserError({
      code: UserErrorCode.GITHUB_USERNAME_ALREADY_EXISTS,
      message: "このGitHubユーザー名は既に使用されています",
      httpStatus: 409,
      details: { field: "github_username", value: username },
    })
  }

  static invalidTimezone(timezone?: string): UserError {
    return new UserError({
      code: UserErrorCode.INVALID_TIMEZONE,
      message: "無効なタイムゾーンです",
      httpStatus: 400,
      details: { field: "timezone", value: timezone },
    })
  }

  static unsupportedLanguage(language?: string): UserError {
    return new UserError({
      code: UserErrorCode.UNSUPPORTED_LANGUAGE,
      message: "サポートされていない言語です",
      httpStatus: 400,
      details: { field: "language", value: language },
    })
  }

  static userNotFound(userId?: string): UserError {
    return new UserError({
      code: UserErrorCode.USER_NOT_FOUND,
      message: "ユーザーが見つかりません",
      httpStatus: 404,
      details: { field: "user_id", value: userId },
    })
  }

  static validationError(
    message: string,
    field?: string,
    value?: string,
  ): UserError {
    return new UserError({
      code: UserErrorCode.VALIDATION_ERROR,
      message,
      httpStatus: 400,
      details: { field, value },
    })
  }

  static profileUpdateFailed(reason?: string): UserError {
    return new UserError({
      code: UserErrorCode.PROFILE_UPDATE_FAILED,
      message: `プロフィールの更新に失敗しました${reason ? `: ${reason}` : ""}`,
      httpStatus: 500,
    })
  }

  static settingsUpdateFailed(reason?: string): UserError {
    return new UserError({
      code: UserErrorCode.SETTINGS_UPDATE_FAILED,
      message: `設定の更新に失敗しました${reason ? `: ${reason}` : ""}`,
      httpStatus: 500,
    })
  }
}
