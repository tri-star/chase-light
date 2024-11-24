import {
  TokenError,
  type AccessTokenPayload,
  type IdTokenPayload,
  type TokenParserInterface,
} from "@/features/auth/services/token-parser-interface"
import * as jose from "jose"

let tokenParserInstance: TokenParserInterface | undefined

export function getTokenParserInstance(): TokenParserInterface {
  if (tokenParserInstance) {
    return tokenParserInstance
  }
  tokenParserInstance = new Auth0TokenParser()
  return tokenParserInstance
}

export function swapTokenParserForTest(newInstance: TokenParserInterface) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("swapTokenParserForTestはテスト環境でのみ使用できます")
  }
  tokenParserInstance = newInstance
}

export class Auth0TokenParser implements TokenParserInterface {
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
        {
          issuer: `https://${process.env.AUTH0_DOMAIN}/`,
          audience: process.env.AUTH0_AUDIENCE,
        },
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

  async extractProviderId(token: string): Promise<string> {
    const payload = await this.parseAccessToken(token)
    return payload.sub || ""
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
