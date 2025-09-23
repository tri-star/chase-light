import type { JWTPayload } from "../../../../../core/auth/types/jwt.types"
import { AuthError } from "../../../../../core/auth/errors/auth.error"
import type { JWTValidatorPort } from "../../../application/ports/jwt-validator.port"

export class StubJWTValidatorAdapter implements JWTValidatorPort {
  private static testUsers: Map<string, JWTPayload> = new Map()

  static registerTestUser(token: string, payload: JWTPayload): void {
    this.testUsers.set(token, payload)
  }

  static clearTestUsers(): void {
    this.testUsers.clear()
  }

  static getTestUserCount(): number {
    return this.testUsers.size
  }

  static getRegisteredTokens(): string[] {
    return Array.from(this.testUsers.keys())
  }

  async validateAccessToken(token: string) {
    return this.validateToken(token)
  }

  async validateIdToken(token: string) {
    return this.validateToken(token)
  }

  private async validateToken(token: string) {
    try {
      if (!token || typeof token !== "string") {
        throw AuthError.tokenMissing()
      }

      const cleanToken = token.replace(/^Bearer\s+/i, "").trim()
      if (!cleanToken) {
        throw AuthError.tokenMissing()
      }

      const payload = StubJWTValidatorAdapter.testUsers.get(cleanToken)
      if (payload) {
        return {
          valid: true as const,
          payload,
        }
      }

      throw AuthError.tokenInvalid("Invalid test token")
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          valid: false as const,
          error: error.message,
        }
      }

      return {
        valid: false as const,
        error: `Token validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }
}
