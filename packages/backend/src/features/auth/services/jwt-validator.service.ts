/**
 * JWT Token Validator
 *
 * JWT トークンの検証とAuth0統合
 */
import jwt from "jsonwebtoken"
import jwksClient from "jwks-rsa"
import type { JwtHeader, SigningKeyCallback } from "jsonwebtoken"
import type {
  JWTPayload,
  TokenValidationResult,
  Auth0Config,
} from "../types/auth.types"
import type { JWTValidatorInterface } from "./jwt-validator.interface"
import { AuthError } from "../errors/auth.error"

/**
 * JWT検証クラス
 */
export class JWTValidator implements JWTValidatorInterface {
  private readonly config: Auth0Config
  private readonly jwksClient: ReturnType<typeof jwksClient>

  constructor(config: Auth0Config) {
    this.config = config
    this.jwksClient = jwksClient({
      jwksUri: config.jwksUri,
      cache: true,
      cacheMaxAge: 12 * 60 * 60 * 1000, // 12時間
      timeout: 30000, // 30秒
    })
  }

  /**
   * アクセストークンを検証する
   */
  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      // トークンの基本的な形式チェック
      if (!token || typeof token !== "string") {
        throw AuthError.tokenMissing()
      }

      // Bearerプレフィックスを除去
      const cleanToken = token.replace(/^Bearer\s+/i, "").trim()

      if (!cleanToken) {
        throw AuthError.tokenMissing()
      }

      // JWT形式の検証（3つの部分に分かれているかチェック）
      const parts = cleanToken.split(".")
      if (parts.length !== 3) {
        throw AuthError.tokenMalformed()
      }

      // ヘッダー部分のBase64デコードを試行
      try {
        const headerStr = globalThis.Buffer.from(
          parts[0],
          "base64url",
        ).toString()
        JSON.parse(headerStr)
      } catch {
        throw AuthError.tokenMalformed()
      }

      // トークンを検証
      const payload = await this.verifyToken(cleanToken, this.config.audience)

      return {
        valid: true,
        payload,
      }
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          valid: false,
          error: error.message,
        }
      }

      // 予期しないエラー
      return {
        valid: false,
        error: `Token validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  /**
   * JWTトークンを検証する（内部メソッド）
   */
  private async verifyToken(
    token: string,
    expectedAudience: string,
  ): Promise<JWTPayload> {
    return new Promise((resolve, reject) => {
      // 署名キーを取得する関数
      const getKey = (header: JwtHeader, callback: SigningKeyCallback) => {
        if (!header.kid) {
          return callback(
            AuthError.tokenInvalid("No kid found in token header"),
          )
        }

        this.jwksClient.getSigningKey(header.kid, (err, key) => {
          if (err) {
            return callback(AuthError.jwksError(err.message))
          }

          const signingKey = key?.getPublicKey()
          if (!signingKey) {
            return callback(AuthError.jwksError("No signing key found"))
          }

          callback(null, signingKey)
        })
      }

      // JWT検証
      jwt.verify(
        token,
        getKey,
        {
          algorithms: this.config.algorithms as jwt.Algorithm[],
          issuer: this.config.issuer,
          audience: expectedAudience,
        },
        (err, decoded) => {
          if (err) {
            reject(this.mapJwtErrorToAuthError(err))
            return
          }

          if (!decoded || typeof decoded === "string") {
            reject(AuthError.tokenInvalid("Invalid token payload"))
            return
          }

          // ペイロードの型安全性を確保
          const payload = decoded as JWTPayload

          // 必須クレームの検証
          if (!payload.sub) {
            reject(AuthError.missingClaims("sub"))
            return
          }

          if (!payload.iss) {
            reject(AuthError.missingClaims("iss"))
            return
          }

          if (!payload.aud) {
            reject(AuthError.missingClaims("aud"))
            return
          }

          resolve(payload)
        },
      )
    })
  }

  /**
   * IDトークンを検証する
   * アクセストークンとほぼ同様だが、audienceとしてアプリケーションAudienceを使用する
   */
  async validateIdToken(token: string): Promise<TokenValidationResult> {
    try {
      if (!token || typeof token !== "string") {
        throw AuthError.tokenMissing()
      }

      const cleanToken = token.replace(/^Bearer\s+/i, "").trim()
      if (!cleanToken) {
        throw AuthError.tokenMissing()
      }

      const parts = cleanToken.split(".")
      if (parts.length !== 3) {
        throw AuthError.tokenMalformed()
      }

      try {
        const headerStr = globalThis.Buffer.from(
          parts[0],
          "base64url",
        ).toString()
        JSON.parse(headerStr)
      } catch {
        throw AuthError.tokenMalformed()
      }

      const payload = await this.verifyToken(
        cleanToken,
        this.config.appAudience,
      )

      return { valid: true, payload }
    } catch (error) {
      if (error instanceof AuthError) {
        return { valid: false, error: error.message }
      }
      return {
        valid: false,
        error: `Token validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  /**
   * JWT検証エラーをAuthErrorにマッピング
   */
  private mapJwtErrorToAuthError(err: unknown): AuthError {
    if (err instanceof AuthError) {
      return err
    }

    // エラーオブジェクトの型ガード
    if (typeof err !== "object" || err === null) {
      return AuthError.validationError("Unknown JWT validation error")
    }

    const errorObj = err as Record<string, unknown>

    // TokenExpiredError
    if (errorObj.name === "TokenExpiredError") {
      return AuthError.tokenExpired(errorObj.expiredAt as Date | undefined)
    }

    // NotBeforeError
    if (errorObj.name === "NotBeforeError") {
      return AuthError.tokenNotActive(errorObj.date as Date | undefined)
    }

    // JsonWebTokenError
    if (errorObj.name === "JsonWebTokenError") {
      const message =
        typeof errorObj.message === "string"
          ? errorObj.message.toLowerCase()
          : ""

      if (message.includes("invalid signature")) {
        return AuthError.invalidSignature()
      }

      if (message.includes("audience invalid")) {
        return AuthError.invalidAudience()
      }

      if (message.includes("issuer invalid")) {
        return AuthError.invalidIssuer()
      }

      if (message.includes("invalid algorithm")) {
        return AuthError.invalidAlgorithm()
      }

      if (message.includes("malformed") || message.includes("invalid token")) {
        return AuthError.tokenMalformed()
      }

      return AuthError.tokenInvalid(
        typeof errorObj.message === "string" ? errorObj.message : undefined,
      )
    }

    // その他のエラー
    const errorMessage =
      typeof errorObj.message === "string"
        ? errorObj.message
        : "Unknown JWT validation error"
    return AuthError.validationError(errorMessage)
  }
}
