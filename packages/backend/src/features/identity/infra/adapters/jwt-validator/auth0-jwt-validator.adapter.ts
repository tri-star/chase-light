import jwt from "jsonwebtoken"
import jwksClient from "jwks-rsa"
import type { JwtHeader, SigningKeyCallback } from "jsonwebtoken"
import type {
  JWTPayload,
  TokenValidationResult,
  Auth0Config,
} from "../../../../../core/auth/types/jwt.types"
import { AuthError } from "../../../../../core/auth/errors/auth.error"
import type { JWTValidatorPort } from "../../../application/ports/jwt-validator.port"

export class Auth0JWTValidatorAdapter implements JWTValidatorPort {
  private readonly config: Auth0Config
  private readonly jwksClient: ReturnType<typeof jwksClient>

  constructor(config: Auth0Config) {
    this.config = config
    this.jwksClient = jwksClient({
      jwksUri: config.jwksUri,
      cache: true,
      cacheMaxAge: 12 * 60 * 60 * 1000,
      timeout: 30000,
    })
  }

  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    return this.validateToken(token, this.config.audience)
  }

  async validateIdToken(token: string): Promise<TokenValidationResult> {
    return this.validateToken(token, this.config.appAudience)
  }

  private async validateToken(
    token: string,
    expectedAudience: string,
  ): Promise<TokenValidationResult> {
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
        const headerStr = globalThis.Buffer.from(parts[0], "base64url").toString()
        JSON.parse(headerStr)
      } catch {
        throw AuthError.tokenMalformed()
      }

      const payload = await this.verifyToken(cleanToken, expectedAudience)

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

      return {
        valid: false,
        error: `Token validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  private async verifyToken(
    token: string,
    expectedAudience: string,
  ): Promise<JWTPayload> {
    return new Promise((resolve, reject) => {
      const getKey = (header: JwtHeader, callback: SigningKeyCallback) => {
        if (!header.kid) {
          return callback(AuthError.tokenInvalid("No kid found in token header"))
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
            return reject(this.mapJwtErrorToAuthError(err))
          }

          const payload = decoded as JWTPayload

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

  private mapJwtErrorToAuthError(err: unknown): AuthError {
    if (err instanceof AuthError) {
      return err
    }

    if (typeof err !== "object" || err === null) {
      return AuthError.validationError("Unknown JWT validation error")
    }

    const errorObj = err as Record<string, unknown>

    if (errorObj.name === "TokenExpiredError") {
      return AuthError.tokenExpired(errorObj.expiredAt as Date | undefined)
    }

    if (errorObj.name === "NotBeforeError") {
      return AuthError.tokenNotActive(errorObj.date as Date | undefined)
    }

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

    const errorMessage =
      typeof errorObj.message === "string"
        ? errorObj.message
        : "Unknown JWT validation error"
    return AuthError.validationError(errorMessage)
  }
}
