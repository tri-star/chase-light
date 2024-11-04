import {
  TokenError,
  type AccessTokenPayload,
  type IdTokenPayload,
  type TokenParserInterface,
} from "@/features/auth/services/token-parser-interface"
import type { User } from "@/features/user/domain/user"

export class StubTokenParser implements TokenParserInterface {
  private authenticatedUser: User | undefined

  setAuthenticatedUser(user: User | undefined) {
    this.authenticatedUser = user
  }

  async extractProviderId(_token: string): Promise<string> {
    return this.authenticatedUser?.providerId ?? ""
  }
  async parseIdToken(_token: string): Promise<IdTokenPayload> {
    if (this.authenticatedUser == null) {
      throw new TokenError("invalid_token", "invalid token")
    }
    return {
      sub: this.authenticatedUser.providerId,
      email: this.authenticatedUser.email,
      email_verified: this.authenticatedUser.emailVerified,
      name: this.authenticatedUser.displayName,
      picture: "",
      aud: [],
      nickname: this.authenticatedUser.accountName,
    }
  }
  async parseAccessToken(_token: string): Promise<AccessTokenPayload> {
    if (this.authenticatedUser == null) {
      throw new TokenError("invalid_token", "invalid token")
    }
    return {
      sub: this.authenticatedUser.providerId,
      email: this.authenticatedUser.email,
      email_verified: this.authenticatedUser.emailVerified,
      aud: [],
    }
  }
}
