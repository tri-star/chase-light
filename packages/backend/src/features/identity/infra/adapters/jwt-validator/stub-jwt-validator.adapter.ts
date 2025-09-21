import type {
  JWTPayload,
  TokenValidationResult,
} from "../../../../../core/auth"
import { AuthError } from "../../../../../core/auth"
import type { JwtValidatorPort } from "../../../application/ports/jwt-validator.port"

export class StubJwtValidatorAdapter implements JwtValidatorPort {
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

  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    return this.validate(token)
  }

  async validateIdToken(token: string): Promise<TokenValidationResult> {
    return this.validate(token)
  }

  private async validate(token: string): Promise<TokenValidationResult> {
    try {
      if (!token || typeof token !== "string") {
        throw AuthError.tokenMissing()
      }

      const cleanToken = token.replace(/^Bearer\s+/i, "").trim()
      if (!cleanToken) {
        throw AuthError.tokenMissing()
      }

      const payload = StubJwtValidatorAdapter.testUsers.get(cleanToken)
      if (!payload) {
        throw AuthError.tokenInvalid("Invalid test token")
      }

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
}

export const registerStubJwtUser = (token: string, payload: JWTPayload) =>
  StubJwtValidatorAdapter.registerTestUser(token, payload)

export const clearStubJwtUsers = () => StubJwtValidatorAdapter.clearTestUsers()
