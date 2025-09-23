/**
 * Authentication Error Types
 *
 * JWT認証における各種エラーを表現する型定義
 */

/**
 * AuthErrorで使用されるHTTPステータスコードの型定義
 */
export type AuthErrorHttpStatus = 400 | 401 | 500

export enum AuthErrorCode {
  TOKEN_MISSING = "TOKEN_MISSING",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  TOKEN_MALFORMED = "TOKEN_MALFORMED",
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
  INVALID_AUDIENCE = "INVALID_AUDIENCE",
  INVALID_ISSUER = "INVALID_ISSUER",
  INVALID_ALGORITHM = "INVALID_ALGORITHM",
  TOKEN_NOT_ACTIVE = "TOKEN_NOT_ACTIVE",
  MISSING_CLAIMS = "MISSING_CLAIMS",
  JWKS_ERROR = "JWKS_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export interface AuthErrorDetails {
  code: AuthErrorCode
  message: string
  httpStatus: AuthErrorHttpStatus
  details?: {
    expiredAt?: Date
    notActiveBefore?: Date
    expected?: string
    actual?: string
    claim?: string
  }
}

export class AuthError extends Error {
  public readonly code: AuthErrorCode
  public readonly httpStatus: AuthErrorHttpStatus
  public readonly details?: AuthErrorDetails["details"]

  constructor(errorDetails: AuthErrorDetails) {
    super(errorDetails.message)
    this.name = "AuthError"
    this.code = errorDetails.code
    this.httpStatus = errorDetails.httpStatus
    this.details = errorDetails.details
  }

  static tokenMissing(): AuthError {
    return new AuthError({
      code: AuthErrorCode.TOKEN_MISSING,
      message: "Authorization token is missing",
      httpStatus: 401,
    })
  }

  static tokenExpired(expiredAt?: Date): AuthError {
    return new AuthError({
      code: AuthErrorCode.TOKEN_EXPIRED,
      message: "Token has expired",
      httpStatus: 401,
      details: { expiredAt },
    })
  }

  static tokenInvalid(reason?: string): AuthError {
    return new AuthError({
      code: AuthErrorCode.TOKEN_INVALID,
      message: reason || "Token is invalid",
      httpStatus: 401,
    })
  }

  static tokenMalformed(): AuthError {
    return new AuthError({
      code: AuthErrorCode.TOKEN_MALFORMED,
      message: "Token format is malformed",
      httpStatus: 401,
    })
  }

  static invalidSignature(): AuthError {
    return new AuthError({
      code: AuthErrorCode.INVALID_SIGNATURE,
      message: "Token signature is invalid",
      httpStatus: 401,
    })
  }

  static invalidAudience(expected?: string, actual?: string): AuthError {
    return new AuthError({
      code: AuthErrorCode.INVALID_AUDIENCE,
      message: "Token audience is invalid",
      httpStatus: 401,
      details: { expected, actual },
    })
  }

  static invalidIssuer(expected?: string, actual?: string): AuthError {
    return new AuthError({
      code: AuthErrorCode.INVALID_ISSUER,
      message: "Token issuer is invalid",
      httpStatus: 401,
      details: { expected, actual },
    })
  }

  static invalidAlgorithm(): AuthError {
    return new AuthError({
      code: AuthErrorCode.INVALID_ALGORITHM,
      message: "Token algorithm is invalid",
      httpStatus: 401,
    })
  }

  static tokenNotActive(notActiveBefore?: Date): AuthError {
    return new AuthError({
      code: AuthErrorCode.TOKEN_NOT_ACTIVE,
      message: "Token is not yet active",
      httpStatus: 401,
      details: { notActiveBefore },
    })
  }

  static missingClaims(claim?: string): AuthError {
    return new AuthError({
      code: AuthErrorCode.MISSING_CLAIMS,
      message: `Required claim is missing${claim ? `: ${claim}` : ""}`,
      httpStatus: 400,
      details: { claim },
    })
  }

  static jwksError(reason?: string): AuthError {
    return new AuthError({
      code: AuthErrorCode.JWKS_ERROR,
      message: `JWKS error: ${reason || "Failed to retrieve signing key"}`,
      httpStatus: 500,
    })
  }

  static validationError(reason?: string): AuthError {
    return new AuthError({
      code: AuthErrorCode.VALIDATION_ERROR,
      message: `Token validation error: ${reason || "Unknown validation error"}`,
      httpStatus: 401,
    })
  }
}
