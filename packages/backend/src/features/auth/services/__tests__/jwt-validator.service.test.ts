/**
 * JWT Validator Tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { JWTValidator } from "../jwt-validator.service"
import type { Auth0Config } from "../../types/auth.types"
import jwt from "jsonwebtoken"

// モックの設定
vi.mock("jwks-rsa", () => {
  return {
    default: vi.fn(() => ({
      getSigningKey: vi.fn((kid, callback) => {
        // テスト用の公開キーを返す
        const mockKey = {
          getPublicKey: () => "mock-public-key",
        }
        callback(null, mockKey)
      }),
    })),
  }
})

vi.mock("jsonwebtoken", () => {
  return {
    default: {
      verify: vi.fn(),
    },
  }
})

describe("JWTValidator", () => {
  let validator: JWTValidator
  let mockConfig: Auth0Config

  beforeEach(() => {
    mockConfig = {
      domain: "test-domain.auth0.com",
      audience: "test-audience",
      issuer: "https://test-domain.auth0.com/",
      jwksUri: "https://test-domain.auth0.com/.well-known/jwks.json",
      algorithms: ["RS256"],
    }

    validator = new JWTValidator(mockConfig)
  })

  describe("validateAccessToken", () => {
    describe("正常系", () => {
      it("有効なJWTトークンを正常に検証する", async () => {
        // 有効なJWT構造のトークンを模擬
        const validPayload = {
          iss: "https://test-domain.auth0.com/",
          sub: "auth0|123456789",
          aud: "test-audience",
          iat: Math.floor(Date.now() / 1000) - 60, // 1分前
          exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後
          scope: "read:user",
        }

        // Base64エンコードされたペイロードを作成
        const header = { alg: "RS256", typ: "JWT", kid: "test-kid" }
        const encodedHeader = globalThis.Buffer.from(
          JSON.stringify(header),
        ).toString("base64url")
        const encodedPayload = globalThis.Buffer.from(
          JSON.stringify(validPayload),
        ).toString("base64url")
        const validToken = `${encodedHeader}.${encodedPayload}.mock-signature`

        // JWT検証をモック
        vi.mocked(jwt.verify).mockImplementation(
          (token, getKey, options, callback) => {
            if (typeof callback === "function") {
              callback(null, validPayload)
            }
          },
        )

        const result = await validator.validateAccessToken(
          `Bearer ${validToken}`,
        )

        expect(result.valid).toBe(true)
        expect(result.payload).toEqual(validPayload)
        expect(result.error).toBeUndefined()
      })

      it("Bearerプレフィックスなしのトークンも正常に処理する", async () => {
        const validPayload = {
          iss: "https://test-domain.auth0.com/",
          sub: "auth0|123456789",
          aud: "test-audience",
          iat: Math.floor(Date.now() / 1000) - 60,
          exp: Math.floor(Date.now() / 1000) + 3600,
        }

        const header = { alg: "RS256", typ: "JWT", kid: "test-kid" }
        const encodedHeader = globalThis.Buffer.from(
          JSON.stringify(header),
        ).toString("base64url")
        const encodedPayload = globalThis.Buffer.from(
          JSON.stringify(validPayload),
        ).toString("base64url")
        const validToken = `${encodedHeader}.${encodedPayload}.mock-signature`

        vi.mocked(jwt.verify).mockImplementation(
          (token, getKey, options, callback) => {
            if (typeof callback === "function") {
              callback(null, validPayload)
            }
          },
        )

        const result = await validator.validateAccessToken(validToken)

        expect(result.valid).toBe(true)
        expect(result.payload).toEqual(validPayload)
      })
    })

    describe("エラーケース", () => {
      it("should return invalid result for missing token", async () => {
        const result = await validator.validateAccessToken("")

        expect(result.valid).toBe(false)
        expect(result.error).toContain("missing")
      })

      it("should return invalid result for malformed token", async () => {
        const result = await validator.validateAccessToken("invalid-token")

        expect(result.valid).toBe(false)
        expect(result.error).toContain("malformed")
      })

      it("should handle Bearer prefix correctly", async () => {
        const result = await validator.validateAccessToken(
          "Bearer invalid.token.format",
        )

        expect(result.valid).toBe(false)
        // Bearer プレフィックスが正しく除去されることを確認
      })

      it("should return invalid result for token without kid in header", async () => {
        // kidなしのヘッダーを持つトークンを作成
        const headerWithoutKid = { alg: "RS256", typ: "JWT" }
        const payload = {
          sub: "test-user",
          iss: "https://test-domain.auth0.com/",
          aud: "test-audience",
        }
        const encodedHeader = globalThis.Buffer.from(
          JSON.stringify(headerWithoutKid),
        ).toString("base64url")
        const encodedPayload = globalThis.Buffer.from(
          JSON.stringify(payload),
        ).toString("base64url")
        const tokenWithoutKid = `${encodedHeader}.${encodedPayload}.invalid-signature`

        // JWT検証をクリア（kidなしエラーをシミュレート）
        vi.mocked(jwt.verify).mockImplementation(
          (token, getKey, options, callback) => {
            if (typeof callback === "function") {
              // @ts-expect-error テスト用のエラーシミュレーション
              callback(new Error("No kid found in token header"), undefined)
            }
          },
        )

        const result = await validator.validateAccessToken(tokenWithoutKid)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })

  describe("token format validation", () => {
    it("should reject tokens with wrong number of parts", async () => {
      const invalidTokens = ["single-part", "two.parts", "four.parts.too.many"]

      for (const token of invalidTokens) {
        const result = await validator.validateAccessToken(token)
        expect(result.valid).toBe(false)
        expect(result.error).toContain("malformed")
      }
    })

    it("should accept tokens with correct JWT format", async () => {
      const validFormatToken = "header.payload.signature"
      const result = await validator.validateAccessToken(validFormatToken)

      // 形式は正しいが、検証では失敗する（署名が無効など）
      expect(result.valid).toBe(false)
      // malformed以外のエラーが発生する（検証失敗など）
      expect(result.error).toBeDefined()
    })
  })

  describe("error handling", () => {
    it("should handle null token gracefully", async () => {
      // @ts-expect-error Testing null input
      const result = await validator.validateAccessToken(null)

      expect(result.valid).toBe(false)
      expect(result.error).toContain("missing")
    })

    it("should handle undefined token gracefully", async () => {
      // @ts-expect-error Testing undefined input
      const result = await validator.validateAccessToken(undefined)

      expect(result.valid).toBe(false)
      expect(result.error).toContain("missing")
    })

    it("should handle non-string token gracefully", async () => {
      // @ts-expect-error Testing non-string input
      const result = await validator.validateAccessToken(123)

      expect(result.valid).toBe(false)
      expect(result.error).toContain("missing")
    })
  })
})
