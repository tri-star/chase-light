/**
 * Exclusive JWT Authentication Middleware
 *
 * パス除外機能付きJWT認証ミドルウェア
 */
import { Context, Next } from "hono"
import {
  createJWTAuthMiddleware,
  type JWTAuthOptions,
} from "./jwt-auth.middleware"
import {
  isPathExcluded,
  isAuthDisabledForNonProduction,
  getAuthExclusionsFromEnv,
  type AuthExclusionConfig,
} from "./auth-exclusions"

export interface ExclusiveJWTAuthOptions extends JWTAuthOptions {
  /** 認証から除外するパス設定 */
  exclusions?: AuthExclusionConfig
  /** 開発環境での認証無効化を許可するか */
  allowDevDisable?: boolean
}

/**
 * 除外パス対応JWT認証ミドルウェアファクトリー
 */
export function createExclusiveJWTAuthMiddleware(
  options: ExclusiveJWTAuthOptions = {},
) {
  const {
    exclusions = getAuthExclusionsFromEnv(),
    allowDevDisable = true,
    ...jwtOptions
  } = options

  // 内部で使用するJWT認証ミドルウェア
  const jwtAuthMiddleware = createJWTAuthMiddleware(jwtOptions)

  return async (c: Context, next: Next) => {
    const path = c.req.path

    // 非本番環境での認証無効化チェック
    if (allowDevDisable && isAuthDisabledForNonProduction()) {
      console.warn(`[AUTH] Authentication disabled for non-production: ${path}`)
      await next()
      return
    }

    // パス除外チェック
    if (isPathExcluded(path, exclusions)) {
      console.log(`[AUTH] Path excluded from authentication: ${path}`)
      await next()
      return
    }

    // JWT認証を実行
    console.log(`[AUTH] Authenticating request: ${path}`)
    try {
      await jwtAuthMiddleware(c, next)
    } catch (error) {
      // JWT認証エラーを適切なHTTPレスポンスに変換
      if (error instanceof Error && error.message === "Unauthorized") {
        return c.json({ error: "Unauthorized" }, 401)
      }
      throw error
    }
  }
}

/**
 * グローバル認証ミドルウェア（デフォルト設定）
 */
export const globalJWTAuth = createExclusiveJWTAuthMiddleware()

/**
 * 厳格な認証ミドルウェア（開発環境無効化なし）
 */
export const strictGlobalJWTAuth = createExclusiveJWTAuthMiddleware({
  allowDevDisable: false,
})
