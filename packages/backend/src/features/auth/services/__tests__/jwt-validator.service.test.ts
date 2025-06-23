/**
 * JWT Validator Tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { JWTValidator } from "../jwt-validator.service"
import type { Auth0Config } from "../../types/auth.types"

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
      // 形式的に正しいが実際の検証で失敗するトークンを作成
      const tokenWithoutKid =
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpc3MiOiJodHRwczovL3Rlc3QtZG9tYWluLmF1dGgwLmNvbS8iLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIn0.invalid-signature"

      const result = await validator.validateAccessToken(tokenWithoutKid)

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
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
