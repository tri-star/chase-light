import * as jose from "jose"

export interface TokenValidator {
  parseAccessToken(token: string): Promise<AccessTokenPayload>
  parseIdToken(token: string): Promise<IdTokenPayload>
}

export function createTokenValidator(): TokenValidator {
  return new Auth0TokenValidator()
}

type AccessTokenPayload = {
  sub?: string
  email?: string
  email_verified?: boolean
  aud?: string[]
}

type IdTokenPayload = {
  sub?: string
  email?: string
  email_verified?: boolean
  aud?: string[]
  nickname?: string
  name?: string
  picture?: string
  updated_at?: string
}

export class Auth0TokenValidator implements TokenValidator {
  /**
   * @param token アクセストークン
   * @returns {AccessTokenPayload}
   * @throws {TokenError}
   */
  async parseAccessToken(token: string): Promise<AccessTokenPayload> {
    const JWKS = jose.createRemoteJWKSet(
      new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`),
    )

    try {
      const { payload }: { payload: AccessTokenPayload } = await jose.jwtVerify(
        token,
        JWKS,
        // TODO: バリデーションする内容の指定
        // {
        //   audience: process.env.API_URL,
        // },
      )

      /*
  "iss": "https://xxxx.auth0.com/",
  "sub": "github|xxxxxxx",
  "aud": [
    "http://localhost:3000",
  ],
  "iat": 173...,
  "exp": 173...,
  "scope": "openid profile email",
  "azp": "7G7M..."
*/

      console.log("token payload", payload)
      return payload
    } catch (error) {
      throw new TokenError("invalid_token", (error as Error).message)
    }
  }

  /**
   * @param token アクセストークン
   * @returns {IdTokenPayload}
   * @throws {TokenError}
   */
  async parseIdToken(token: string): Promise<IdTokenPayload> {
    const JWKS = jose.createRemoteJWKSet(
      new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`),
    )

    try {
      const { payload }: { payload: AccessTokenPayload } = await jose.jwtVerify(
        token,
        JWKS,
        // TODO: バリデーションする内容の指定
        // {
        //   audience: process.env.API_URL,
        // },
      )

      /*
  "nickname": "",
  "name": "",
  "picture": "https://avatars.githubusercontent.com/u/",
  "updated_at": "2024-11-02T09:15:38.071Z",
  "email": "",
  "email_verified": true,
  "iss": "https://xxxx.auth0.com/",
  "aud": "7G7M...",
  "iat": 173...,
  "exp": 173...,
  "sub": "github|...",
  "auth_time": 1730...,
  "sid": "jSNu..."
*/

      console.log("token payload", payload)
      return payload
    } catch (error) {
      throw new TokenError("invalid_token", (error as Error).message)
    }
  }
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
