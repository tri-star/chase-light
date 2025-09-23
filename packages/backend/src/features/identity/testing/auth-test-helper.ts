import type { JWTPayload } from "../../../core/auth/types/jwt.types.js"
import { StubJWTValidatorAdapter } from "../infra/adapters/jwt-validator/stub-jwt-validator.adapter.js"

export class AuthTestHelper {
  static createTestToken(
    userId: string,
    email: string,
    name: string,
    additionalClaims: Partial<JWTPayload> = {},
  ): string {
    const token = `test-token-${userId}`
    const currentTime = Math.floor(Date.now() / 1000)

    const payload: JWTPayload = {
      sub: userId,
      email,
      name,
      iss: "https://test.auth0.com/",
      aud: "test-audience",
      iat: currentTime,
      exp: currentTime + 3600,
      ...additionalClaims,
    }

    StubJWTValidatorAdapter.registerTestUser(token, payload)
    return token
  }

  static createAuthHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  static createTestUsers(
    users: Array<{
      userId: string
      email: string
      name: string
      additionalClaims?: Partial<JWTPayload>
    }>,
  ): string[] {
    return users.map((user) =>
      this.createTestToken(
        user.userId,
        user.email,
        user.name,
        user.additionalClaims,
      ),
    )
  }

  static createInvalidToken(tokenSuffix = "invalid"): string {
    return `invalid-test-token-${tokenSuffix}`
  }

  static createExpiredToken(
    userId: string,
    email: string,
    name: string,
  ): string {
    const token = `expired-token-${userId}`
    const currentTime = Math.floor(Date.now() / 1000)

    const payload: JWTPayload = {
      sub: userId,
      email,
      name,
      iss: "https://test.auth0.com/",
      aud: "test-audience",
      iat: currentTime - 7200,
      exp: currentTime - 3600,
    }

    StubJWTValidatorAdapter.registerTestUser(token, payload)
    return token
  }

  static clearTestUsers(): void {
    StubJWTValidatorAdapter.clearTestUsers()
  }

  static getTestUserCount(): number {
    return StubJWTValidatorAdapter.getTestUserCount()
  }
}
