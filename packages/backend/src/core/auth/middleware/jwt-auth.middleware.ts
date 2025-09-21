/**
 * JWT Authentication Middleware
 *
 * Hono用のJWT認証ミドルウェア
 */
import { Context, Next } from "hono"
import { HTTPException } from "hono/http-exception"
import type {
  AuthenticatedUser,
  AuthContext,
  AccessTokenValidator,
} from "../types/auth.types"
import { AuthError } from "../errors/auth.error"

/**
 * JWT認証ミドルウェアのオプション
 */
export interface JWTAuthOptions {
  /** 必須認証を無効にする（開発環境など） */
  optional?: boolean
  /** カスタムトークン抽出関数 */
  extractToken?: (c: Context) => string | null
  /** エラーハンドリングのカスタマイズ */
  onError?: (error: AuthError, c: Context) => never
}

export interface JWTAuthDependencies {
  validator: AccessTokenValidator
}

/**
 * デフォルトのトークン抽出関数
 */
function defaultExtractToken(c: Context): string | null {
  // Authorization ヘッダーから取得
  const authHeader = c.req.header("Authorization")
  if (authHeader) {
    return authHeader
  }

  // クエリパラメータから取得（本番環境以外のみ）
  const appStage = process.env.APP_STAGE
  if (!appStage) {
    throw new Error("APP_STAGE environment variable is required but not set")
  }

  if (appStage !== "prod") {
    const tokenFromQuery = c.req.query("access_token")
    if (tokenFromQuery) {
      return `Bearer ${tokenFromQuery}`
    }
  }

  return null
}

/**
 * デフォルトのエラーハンドラー
 */
function defaultErrorHandler(error: AuthError, c: Context): never {
  throw new HTTPException(error.httpStatus as 401, {
    message: error.message,
    cause: {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
      timestamp: new Date().toISOString(),
      path: c.req.path,
    },
  })
}

/**
 * JWT認証ミドルウェアファクトリー
 */
export function createJWTAuthMiddleware(
  { validator }: JWTAuthDependencies,
  options: JWTAuthOptions = {},
) {
  const {
    optional = false,
    extractToken = defaultExtractToken,
    onError = defaultErrorHandler,
  } = options

  return async (c: Context, next: Next) => {
    try {
      // トークンを抽出
      const token = extractToken(c)

      if (!token) {
        if (optional) {
          // オプショナル認証の場合、認証情報なしで続行
          await next()
          return
        }

        throw AuthError.tokenMissing()
      }

      // トークンを検証
      const validationResult = await validator.validateAccessToken(token)

      if (!validationResult.valid) {
        if (optional) {
          // オプショナル認証の場合、無効なトークンでも続行
          await next()
          return
        }

        throw AuthError.tokenInvalid(validationResult.error)
      }

      if (!validationResult.payload) {
        throw AuthError.tokenInvalid("No payload found in token")
      }

      // 認証情報をコンテキストに設定
      const cleanToken = token.replace(/^Bearer\s+/i, "").trim()
      const authenticatedUser: AuthenticatedUser = {
        sub: validationResult.payload.sub,
        payload: validationResult.payload,
        accessToken: cleanToken,
      }

      const authContext: AuthContext = {
        user: authenticatedUser,
      }

      c.set("auth", authContext)

      await next()
    } catch (error) {
      if (error instanceof AuthError) {
        onError(error, c)
        return // onErrorがthrowするのでここには到達しない
      }

      // 予期しないエラー
      if (error instanceof HTTPException) {
        throw error
      }

      const authError = AuthError.validationError(
        error instanceof Error ? error.message : "Unknown authentication error",
      )
      onError(authError, c)
      return // onErrorがthrowするのでここには到達しない
    }
  }
}

/**
 * 認証済みユーザーを取得するヘルパー関数
 */
export function getAuthenticatedUser(c: Context): AuthenticatedUser | null {
  const authContext = c.get("auth")
  return authContext?.user || null
}

/**
 * 認証必須のエンドポイント用ヘルパー関数
 */
export function requireAuth(c: Context): AuthenticatedUser {
  const user = getAuthenticatedUser(c)
  if (!user) {
    throw AuthError.tokenMissing()
  }
  return user
}
