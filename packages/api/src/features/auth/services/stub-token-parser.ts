import {
  TokenError,
  type AccessTokenPayload,
  type IdTokenPayload,
  type TokenParserInterface,
} from '@/features/auth/services/token-parser-interface'
import type { User } from '@/features/user/domain/user'

export class StubTokenParser implements TokenParserInterface {
  private user: User | undefined

  setUser(user: User | undefined) {
    this.user = user
  }

  async extractProviderId(_token: string): Promise<string> {
    return this.user?.providerId ?? ''
  }
  async parseIdToken(_token: string): Promise<IdTokenPayload> {
    if (this.user == null) {
      throw new TokenError('invalid_token', 'invalid token')
    }
    return {
      sub: this.user.providerId,
      email: this.user.email,
      email_verified: this.user.emailVerified,
      name: this.user.displayName,
      picture: '',
      aud: [],
      nickname: this.user.accountName,
    }
  }
  async parseAccessToken(_token: string): Promise<AccessTokenPayload> {
    if (this.user == null) {
      throw new TokenError('invalid_token', 'invalid token')
    }
    return {
      sub: this.user.providerId,
      email: this.user.email,
      email_verified: this.user.emailVerified,
      aud: [],
    }
  }
}
