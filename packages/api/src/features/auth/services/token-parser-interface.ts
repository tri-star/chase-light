export interface TokenParserInterface {
  parseAccessToken(token: string): Promise<AccessTokenPayload>
  extractProviderId(token: string): Promise<string>
  parseIdToken(token: string): Promise<IdTokenPayload>
}

export type AccessTokenPayload = {
  sub?: string
  email?: string
  email_verified?: boolean
  aud?: string[]
}

export type IdTokenPayload = {
  sub?: string
  email?: string
  email_verified?: boolean
  aud?: string[]
  nickname?: string
  name?: string
  picture?: string
  updated_at?: string
}

type TokenErrorType = "invalid_token"

export class TokenError extends Error {
  private static readonly CLASS = "TokenError"

  public readonly type: TokenErrorType = "invalid_token" as const

  public readonly message: string

  constructor(type: TokenErrorType, message: string) {
    super(`${TokenError.CLASS}: ${message}`)
    this.message = message
  }
}
